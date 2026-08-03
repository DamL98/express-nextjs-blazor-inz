import { validateAuthConfiguration } from "./auth.js";
import { validateGoogleCalendarConfiguration } from "./google-calendar.js";
import { validateGoogleOAuthConfiguration } from "./google-oauth.js";

// waliduje config wymagany do modułów przed startem servera
// dane wymagane z .env
export function validateRuntimeConfiguration() {
  validateAuthConfiguration();
  validateGoogleOAuthConfiguration();
  validateGoogleCalendarConfiguration();
}
