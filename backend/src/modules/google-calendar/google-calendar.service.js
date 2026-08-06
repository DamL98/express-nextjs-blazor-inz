import { z } from "zod";

import {
  createGoogleCalendarApiFromRefreshToken,
  decryptGoogleRefreshToken,
  encryptGoogleRefreshToken,
} from "../../config/google-calendar.js";
import {
  GOOGLE_CALENDAR_SCOPES,
  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  getGoogleCalendarOAuthRedirectUri,
  validateFrontendRedirectUrl,
} from "../../config/google-oauth.js";
import {
  createGoogleOAuthState,
  verifyGoogleOAuthState,
} from "../../config/auth.js";
import {
  GoogleOAuthValidationError,
  OAuthStateVerificationError,
} from "../../config/config.errors.js";
import { ApiError } from "../../errors/apiError.js";
import { ProblemDefinitions } from "../../errors/problemDefinitions.js";
import { calendarIntegrationRepository } from "../../repositories/calendar-integration.repository.js";
import { reservationRepository } from "../../repositories/reservation.repository.js";
import { userRepository } from "../../repositories/user.repository.js";

const GOOGLE_CALENDAR_PROVIDER = "google";
const GOOGLE_CALENDAR_STATE_PURPOSE = "google-calendar-connect";

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
  const validatedRedirectTo = validateFrontendRedirectUrl(redirectTo);
  // Osobny stan OAuth pozwala powiązać połączenie kalendarza z użytkownikiem.
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
}

export function readConnectionState(state) {
  let payload;

  try {
    payload = verifyGoogleOAuthState(state);
  } catch (error) {
    if (error instanceof OAuthStateVerificationError) {
      throw ApiError.from(ProblemDefinitions.GOOGLE_CALENDAR_STATE_INVALID, {
        cause: error,
      });
    }

    throw error;
  }

  const parsed = googleCalendarStateSchema.safeParse(payload);

  if (!parsed.success) {
    throw ApiError.from(ProblemDefinitions.GOOGLE_CALENDAR_STATE_INVALID, {
      extensions: { errors: parsed.error.flatten() },
    });
  }

  try {
    return {
      ...parsed.data,
      redirectTo: validateFrontendRedirectUrl(parsed.data.redirectTo),
    };
  } catch (error) {
    if (error instanceof GoogleOAuthValidationError) {
      throw ApiError.from(ProblemDefinitions.GOOGLE_CALENDAR_STATE_INVALID, {
        cause: error,
      });
    }

    throw error;
  }
}

export async function getConnectionStatus(userId) {
  const integration = await calendarIntegrationRepository.findByUserId(userId);
  return mapConnection(integration);
}

export async function connectCalendarFromCode(state, code, redirectUri) {
  const { userId } = readConnectionState(state);
  const user = await userRepository.findPublicUserById(userId);

  if (!user) {
    throw ApiError.from(ProblemDefinitions.AUTH_SESSION_INVALID);
  }

  const { googleUser, tokens } = await exchangeGoogleCode(code, redirectUri);

  if (googleUser.googleId !== user.googleId) {
    throw ApiError.from(ProblemDefinitions.GOOGLE_ACCOUNT_MISMATCH, {
      detail: "Polaczenie Calendar musi dotyczyc konta uzytego do logowania",
    });
  }

  if (!tokens.refresh_token) {
    throw ApiError.from(ProblemDefinitions.GOOGLE_REFRESH_TOKEN_MISSING, {
      detail: "Google nie zwrocil refresh tokenu. Ponownie wyraz zgode",
    });
  }

  // Po zgodzie refresh token jest używany do tworzenia wydarzeń w tle.
  const integration = await calendarIntegrationRepository.upsertConnection({
    userId,
    provider: GOOGLE_CALENDAR_PROVIDER,
    calendarEmail: googleUser.email,
    refreshTokenEncrypted: encryptGoogleRefreshToken(tokens.refresh_token),
    tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  });

  return mapConnection(integration);
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
