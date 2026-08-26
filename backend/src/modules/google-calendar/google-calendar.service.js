import { z } from "zod";

import {
  createGoogleCalendarApiFromRefreshToken,
} from "../../config/google-calendar.js";
import {
  GOOGLE_CALENDAR_SCOPES,
  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  getGoogleCalendarOAuthRedirectUri,
  validateFrontendRedirectUrl,
} from "../../config/google-oauth.js";
import {
  ConfigurationError,
  GoogleOAuthValidationError,
} from "../../config/config.errors.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";
import { calendarIntegrationRepository } from "../../repositories/calendar-integration.repository.js";
import { reservationRepository } from "../../repositories/reservation.repository.js";
import { userRepository } from "../../repositories/user.repository.js";
import {
  decryptGoogleRefreshToken,
  encryptGoogleRefreshToken,
} from "../../security/googleRefreshToken.js";
import {
  createGoogleOAuthState,
  verifyGoogleOAuthState,
} from "../../security/jwt.js";

const GOOGLE_CALENDAR_PROVIDER = "google";
const GOOGLE_CALENDAR_STATE_PURPOSE = "google-calendar-connect";

function toGoogleCalendarApiError(error, validationProblem) {
  if (error instanceof ConfigurationError) {
    return new ApiError(Problems.GOOGLE_CALENDAR_NOT_CONFIGURED, {
      detail: error.message,
      cause: error,
    });
  }

  if (validationProblem && error instanceof GoogleOAuthValidationError) {
    return new ApiError(validationProblem, {
      detail: error.message,
      cause: error,
    });
  }

  return error;
}

const googleCalendarStateSchema = z.object({
  purpose: z.literal(GOOGLE_CALENDAR_STATE_PURPOSE),
  userId: z.uuid("Bledny userId w stanie OAuth."),
  redirectTo: z.string().optional(),
});

function mapConnection(integration) {
  if (!integration) {
    return {
      connected: false,
      provider: null,
      calendarEmail: null,
      connectedAt: null,
      tokenExpiresAt: null,
      syncEnabled: false,
    };
  }

  return {
    connected: true,
    provider: integration.provider,
    calendarEmail: integration.calendarEmail,
    connectedAt: integration.createdAt,
    tokenExpiresAt: integration.tokenExpiresAt,
    syncEnabled: true,
  };
}

function buildReservationEvent(reservation, room) {
  const descriptionParts = [];

  if (reservation.description) {
    descriptionParts.push(reservation.description);
  }

  descriptionParts.push(`Sala: ${room.name}`);
  descriptionParts.push(`Lokalizacja: ${room.location}`);

  return {
    summary: reservation.title,
    description: descriptionParts.join("\n"),
    location: room.location,
    start: {
      dateTime: reservation.startTime.toISOString(),
    },
    end: {
      dateTime: reservation.endTime.toISOString(),
    },
  };
}

export function createConnectionAuthorizationUrl(userId, redirectTo) {
  try {
    const validatedRedirectTo = validateFrontendRedirectUrl(redirectTo);
    // Osobny stan OAuth pozwala powiązać połączenie z użytkownikiem.
    const state = createGoogleOAuthState({
      purpose: GOOGLE_CALENDAR_STATE_PURPOSE,
      redirectTo: validatedRedirectTo,
      userId,
    });

    return buildGoogleAuthorizationUrl({
      state,
      scope: GOOGLE_CALENDAR_SCOPES,
      redirectUri: getGoogleCalendarOAuthRedirectUri(),
    });
  } catch (error) {
    throw toGoogleCalendarApiError(error, Problems.INVALID_GOOGLE_REDIRECT);
  }
}

export function readConnectionState(state) {
  let payload;

  try {
    payload = verifyGoogleOAuthState(state);
  } catch (error) {
    throw new ApiError(Problems.GOOGLE_CALENDAR_STATE_INVALID, {
      cause: error,
    });
  }

  const parsed = googleCalendarStateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError(Problems.GOOGLE_CALENDAR_STATE_INVALID, {
      cause: parsed.error,
    });
  }

  try {
    return {
      ...parsed.data,
      redirectTo: validateFrontendRedirectUrl(parsed.data.redirectTo),
    };
  } catch (error) {
    throw toGoogleCalendarApiError(
      error,
      Problems.GOOGLE_CALENDAR_STATE_INVALID,
    );
  }
}

export async function getConnectionStatus(userId) {
  const integration = await calendarIntegrationRepository.findByUserId(userId);
  return mapConnection(integration);
}

export async function connectCalendarFromCode(state, code, redirectUri) {
  try {
    const { userId } = readConnectionState(state);
    const user = await userRepository.findPublicUserById(userId);

    if (!user) {
      throw new ApiError(Problems.AUTH_SESSION_INVALID);
    }

    const { googleUser, tokens } = await exchangeGoogleCode(code, redirectUri);

    if (googleUser.googleId !== user.googleId) {
      throw new ApiError(Problems.GOOGLE_ACCOUNT_MISMATCH, {
        detail: "Polaczenie Calendar musi dotyczyc konta uzytego do logowania",
      });
    }

    if (!tokens.refresh_token) {
      throw new ApiError(Problems.GOOGLE_REFRESH_TOKEN_MISSING, {
        detail: "Google nie zwrocil refresh tokenu. Ponownie wyraz zgode",
      });
    }

    // Refresh token umożliwia synchronizację bez udziału użytkownika.
    const integration = await calendarIntegrationRepository.upsertConnection({
      userId,
      provider: GOOGLE_CALENDAR_PROVIDER,
      calendarEmail: googleUser.email,
      refreshTokenEncrypted: encryptGoogleRefreshToken(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    return mapConnection(integration);
  } catch (error) {
    throw toGoogleCalendarApiError(error);
  }
}

export async function disconnectCalendar(userId) {
  await calendarIntegrationRepository.deleteByUserId(userId);

  return {
    disconnected: true,
  };
}

export async function syncReservation(reservation, room) {
  const integration = await calendarIntegrationRepository.findByUserId(
    reservation.userId,
  );

  if (!integration) {
    return reservation;
  }

  try {
    const refreshToken = decryptGoogleRefreshToken(
      integration.refreshTokenEncrypted,
    );
    const calendarApi = createGoogleCalendarApiFromRefreshToken(refreshToken);
    const event = buildReservationEvent(reservation, room);
    const { data } = await calendarApi.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    if (!data.id) {
      return reservation;
    }

    return reservationRepository.setGoogleCalendarEventId(
      reservation.id,
      data.id,
    );
  } catch (error) {
    console.error("Google Calendar sync err", error);
    return reservation;
  }
}

export async function removeReservationFromCalendar(reservation) {
  if (!reservation.googleCalendarEventId) {
    return false;
  }

  const integration = await calendarIntegrationRepository.findByUserId(
    reservation.userId,
  );

  if (!integration) {
    return false;
  }

  try {
    const refreshToken = decryptGoogleRefreshToken(
      integration.refreshTokenEncrypted,
    );
    const calendarApi = createGoogleCalendarApiFromRefreshToken(refreshToken);

    await calendarApi.events.delete({
      calendarId: "primary",
      eventId: reservation.googleCalendarEventId,
    });

    return true;
  } catch (error) {
    console.error("Google Calendar sync delete error", error);
    return false;
  }
}
