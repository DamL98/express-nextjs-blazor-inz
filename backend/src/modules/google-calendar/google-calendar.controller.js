import { getGoogleCalendarOAuthRedirectUri } from "../../config/google-oauth.js";
import { isGoogleCalendarConfigError } from "../../config/google-calendar.js";
import { ApiError } from "../../errors/apiError.js";
import { successResponse } from "../../utils/api-response.js";
import { googleCalendarService } from "./google-calendar.service.js";

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
  const status = await googleCalendarService.getConnectionStatus(
    res.locals.user.id,
  );

  return res.status(200).json(successResponse(status));
}

export async function startGoogleCalendarConnection(req, res, next) {
  try {
    const redirectTo = res.locals.validated.query.redirectTo;
    const authorizationUrl = googleCalendarService.createConnectionAuthorizationUrl(
      res.locals.user.id,
      redirectTo,
    );

    return res.redirect(302, authorizationUrl);
  } catch (error) {
    if (isGoogleCalendarConfigError(error)) {
      return next(
        new ApiError(503, "GOOGLE_CALENDAR_NOT_CONFIGURED", error.message),
      );
    }

    return next(error);
  }
}

export async function handleGoogleCalendarCallback(req, res, next) {
  const state = req.query.state?.toString();

  if (!state) {
    return next(
      new ApiError(
        400,
        "GOOGLE_CALENDAR_STATE_REQUIRED",
        "Brak state w callbacku Google Calendar",
      ),
    );
  }

  let redirectTo;

  try {
    redirectTo = googleCalendarService.readConnectionState(state).redirectTo;
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
    await googleCalendarService.connectCalendarFromCode(
      state,
      code,
      getGoogleCalendarOAuthRedirectUri(),
    );

    return res.redirect(302, buildRedirectUrl(redirectTo, "connected"));
  } catch (error) {
    if (isGoogleCalendarConfigError(error)) {
      return next(
        new ApiError(503, "GOOGLE_CALENDAR_NOT_CONFIGURED", error.message),
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
  const result = await googleCalendarService.disconnectCalendar(
    res.locals.user.id,
  );

  return res.status(200).json(successResponse(result));
}
