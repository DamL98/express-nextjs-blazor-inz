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
import { ApiError } from "../../errors/apiError.js";
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

export const googleCalendarService = {
  createConnectionAuthorizationUrl(userId, redirectTo) {
    const validatedRedirectTo = validateFrontendRedirectUrl(redirectTo);
    // Osobny stan OAuth
    // pozwala powiązać próbę połączenia kalendarza z konkretnym użytkownikiem w apace
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
  },

  readConnectionState(state) {
    const payload = verifyGoogleOAuthState(state);
    const parsed = googleCalendarStateSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError(
        400,
        "GOOGLE_CALENDAR_STATE_INVALID",
        "Nieprawidlowy stan polaczenia Google Calendar",
      );
    }

    return {
      ...parsed.data,
      redirectTo: validateFrontendRedirectUrl(parsed.data.redirectTo),
    };
  },

  async getConnectionStatus(userId) {
    const integration = await calendarIntegrationRepository.findByUserId(userId);
    return mapConnection(integration);
  },

  async connectCalendarFromCode(state, code, redirectUri) {
    const { userId } = this.readConnectionState(state);
    const user = await userRepository.findPublicUserById(userId);

    if (!user) {
      throw new ApiError(
        404,
        "AUTH_SESSION_INVALID",
        "Uzytkownik nie istnieje",
      );
    }

    const { googleUser, tokens } = await exchangeGoogleCode(code, redirectUri);

    if (googleUser.googleId !== user.googleId) {
      throw new ApiError(
        409,
        "GOOGLE_ACCOUNT_MISMATCH",
        "Polaczenie Google Calendar musi dotyczyc tego samego konta co logowanie",
      );
    }

    if (!tokens.refresh_token) {
      throw new ApiError(
        400,
        "GOOGLE_REFRESH_TOKEN_MISSING",
        "Google nie zwrocil refresh tokena. Wymagane jest ponowne wyrazenie zgody",
      );
    }

    // Po jednorazowej zgodzie jest zapis refresh_token i później jest używany do tworzenia eventów w tle
    const integration = await calendarIntegrationRepository.upsertConnection({
      userId,
      provider: GOOGLE_CALENDAR_PROVIDER,
      calendarEmail: googleUser.email,
      refreshTokenEncrypted: encryptGoogleRefreshToken(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    return mapConnection(integration);
  },

  async disconnectCalendar(userId) {
    await calendarIntegrationRepository.deleteByUserId(userId);

    return {
      disconnected: true,
    };
  },

  async syncReservation(reservation, room) {
    const integration = await calendarIntegrationRepository.findByUserId(
      reservation.userId,
    );

    if (!integration) {
      return reservation;
    }

    try {
      // Jeśli User połączył konto Google, nowa rezerwacja ma być od razu kopiowana do jego głównego kalendarza
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
  },

  async removeReservationFromCalendar(reservation) {
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
      // Przy anulowaniu usuwamy wcześniej utworzony event Googla tylko jak rezerwacja byla juz zsynchronizowana
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
  },
};
