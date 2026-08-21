import { google } from "googleapis";

import { createGoogleOAuthClient } from "./google-oauth.js";

export function createGoogleCalendarApiFromRefreshToken(refreshToken) {
  const client = createGoogleOAuthClient();
  client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({
    version: "v3",
    auth: client,
  });
}
