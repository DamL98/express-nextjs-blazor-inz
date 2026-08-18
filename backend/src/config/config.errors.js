export class ConfigurationError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class GoogleOAuthConfigurationError extends ConfigurationError {}

export class GoogleCalendarConfigurationError extends ConfigurationError {}

export class GoogleOAuthValidationError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class GoogleCalendarTokenError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class SessionTokenVerificationError extends Error {
  constructor(message = "Nieprawidlowy token sesji", options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class OAuthStateVerificationError extends Error {
  constructor(message = "Nieprawidlowy stan OAuth", options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
