import { ApiError } from "../errors/apiError.js";
import { ProblemDefinitions } from "../errors/problemDefinitions.js";

export function validateMiddleware(schema, target = "query") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(ApiError.from(ProblemDefinitions.VALIDATION_ERROR, {
        extensions: { errors: result.error.flatten() },
      }));
    }

    res.locals.validated = {
      ...res.locals.validated,
      [target]: result.data,
    };

    return next();
  };
}
