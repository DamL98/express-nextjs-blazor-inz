import { getGoogleCalendarOAuthRedirectUri } from "../../config/google-oauth.js";
import {
  ConfigurationError,
  GoogleOAuthValidationError,
} from "../../config/config.errors.js";
import { ApiError } from "../../errors/apiError.js";
import {
  BadRequestError,
  ServiceUnavailableError,
} from "../../errors/httpErrors.js";
import { ApiResponse } from "../../utils/api-response.js";
import {
  connectCalendarFromCode,
  createConnectionAuthorizationUrl,
  disconnectCalendar,
  getConnectionStatus,
  readConnectionState,
} from "./google-calendar.service.js";

function buildRedirectUrl(redirectTo, status, reason = null) {
  const url = new URL(redirectTo);
  url.searchParams.set("googleCalendar", status);

  if (reason) {
    url.searchParams.set("reason", reason);
  } else {
    url.searchParams.delete("reason");
  }

  return url.toString();
}

export async function getGoogleCalendarStatus(_req, res) {
  const status = await getConnectionStatus(
    res.locals.user.id,
  );

  return ApiResponse.ok(status).send(res);
}

export async function startGoogleCalendarConnection(req, res, next) {
  try {
    const redirectTo = res.locals.validated.query.redirectTo;
    const authorizationUrl = createConnectionAuthorizationUrl(
      res.locals.user.id,
      redirectTo,
    );

    return res.redirect(302, authorizationUrl);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return next(
        new ServiceUnavailableError(
          error.message,
          "GOOGLE_CALENDAR_NOT_CONFIGURED",
        ),
      );
    }

    if (error instanceof GoogleOAuthValidationError) {
      return next(
        new BadRequestError(error.message, "INVALID_GOOGLE_REDIRECT"),
      );
    }

    return next(error);
  }
}

export async function handleGoogleCalendarCallback(req, res, next) {
  const state = req.query.state?.toString();

  if (!state) {
    return next(
      new BadRequestError(
        "Brak state w callbacku Google Calendar",
        "GOOGLE_CALENDAR_STATE_REQUIRED",
      ),
    );
  }

  let redirectTo;

  try {
    redirectTo = readConnectionState(state).redirectTo;
  } catch (error) {
    return next(error);
  }

  if (req.query.error) {
    return res.redirect(
      302,
      buildRedirectUrl(redirectTo, "error", req.query.error.toString()),
    );
  }

  const code = req.query.code?.toString().trim();

  if (!code) {
    return res.redirect(
      302,
      buildRedirectUrl(redirectTo, "error", "missing_code"),
    );
  }

  try {
    // callback kończy osobny flow połączenia Google Calendar i odsyła usera z powrotem na frontend
    await connectCalendarFromCode(
      state,
      code,
      getGoogleCalendarOAuthRedirectUri(),
    );

    return res.redirect(302, buildRedirectUrl(redirectTo, "connected"));
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return next(
        new ServiceUnavailableError(
          error.message,
          "GOOGLE_CALENDAR_NOT_CONFIGURED",
        ),
      );
    }

    if (error instanceof ApiError) {
      return res.redirect(
        302,
        buildRedirectUrl(redirectTo, "error", error.code.toLowerCase()),
      );
    }

    console.error("Google Calendar callback failed:", error);
    return res.redirect(
      302,
      buildRedirectUrl(redirectTo, "error", "integration_failed"),
    );
  }
}

export async function disconnectGoogleCalendar(_req, res) {
  const result = await disconnectCalendar(
    res.locals.user.id,
  );

  return ApiResponse.ok(result).send(res);
}
