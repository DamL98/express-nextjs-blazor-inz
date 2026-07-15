export type GoogleCalendarConnectionStatus = {
  connected: boolean;
  provider: string | null;
  calendarEmail: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
  syncEnabled: boolean;
};
