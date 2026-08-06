const RESERVED_FIELDS = new Set([
  "type",
  "title",
  "status",
  "detail",
  "instance",
  "code",
]);

// dokumentacja RFC-9457 - std zwracania błędow API
// https://www.rfc-editor.org/info/rfc9457/

export class ApiError extends Error {
  // dziedziczy message, stack, cause po Error

  // definition -> z ProblemDefinitions.js np. BAD_REQUEST
  // wymagane: definicja w problemDefinitions, type, title, http status, status bledu 400-599, code
  constructor(
    definition,
    {
      detail = definition?.detail,
      extensions = {},
      cause = undefined,
    } = {},
  ) {
    if (
      !definition ||
      !definition.type ||
      !definition.title ||
      !Number.isInteger(definition.status) ||
      definition.status < 400 ||
      definition.status > 599 ||
      !definition.code
    ) {
      throw new TypeError("Nieprawidlowa definicja ApiError");
    }

    for (const key of Object.keys(extensions)) {
      if (RESERVED_FIELDS.has(key)) {
        throw new TypeError(`Rozszerzenie nie moze nadpisac zarezerwowanego pola ${key}`);
      }
    }

    // odpala konstrutkor z Error
    super(detail, cause ? { cause } : undefined);

    this.name = "ApiError";
    this.type = definition.type;
    this.title = definition.title;
    this.status = definition.status;
    this.code = definition.code;
    this.extensions = { ...extensions };

    Error.captureStackTrace?.(this, ApiError);
  }

  static from(definition, options = {}) {
    return new ApiError(definition, options);
  }

  toProblemDetails(instance = undefined) {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.message,
      ...(instance ? { instance } : {}),
      code: this.code,
      ...this.extensions,
    };
  }
}
