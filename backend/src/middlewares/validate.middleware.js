import { ApiError } from "../errors/apiError.js";

export function validate(schema, target = "query") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(
        new ApiError(
          400,
          "VALIDATION_ERROR",
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