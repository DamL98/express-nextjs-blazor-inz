import { ValidationError } from "../errors/validationError.js";

export function validateMiddleware(schema, target = "query") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(
        new ValidationError(
          "Błędne dane wejściowe",
          result.error.flatten(),
        ),
      );
    }

    res.locals.validated = {
      ...res.locals.validated,
      [target]: result.data,
    };

    return next();
  };
}
