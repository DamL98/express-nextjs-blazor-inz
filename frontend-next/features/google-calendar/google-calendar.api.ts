import { apiRequest } from "@/lib/api/http-client";
import { API_URL } from "@/lib/config/env";
import type { GoogleCalendarConnectionStatus } from "./google-calendar.types";

export function getGoogleCalendarStatus(): Promise<GoogleCalendarConnectionStatus> {
  return apiRequest<GoogleCalendarConnectionStatus>("/google-calendar/status", {
    cache: "no-store",
  });
}

export function redirectToGoogleCalendarConnection(redirectTo: string) {
  const url = new URL(`${API_URL}/google-calendar/connect/start`);
  url.searchParams.set("redirectTo", redirectTo);
  window.location.assign(url.toString());
}
