class NamedError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ConfigurationError extends NamedError {}

export class GoogleOAuthConfigurationError extends ConfigurationError {}

export class GoogleCalendarConfigurationError extends ConfigurationError {}

export class GoogleOAuthValidationError extends NamedError {}

export class GoogleCalendarTokenError extends NamedError {}

export class SessionTokenVerificationError extends NamedError {
  constructor(message = "Nieprawidlowy token sesji", options = {}) {
    super(message, options);
  }
}

export class OAuthStateVerificationError extends NamedError {
  constructor(message = "Nieprawidlowy stan OAuth", options = {}) {
    super(message, options);
  }
}
