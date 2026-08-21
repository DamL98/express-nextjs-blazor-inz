export function validateMiddleware(schema, target = "query") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(result.error);
    }

    res.locals.validated = {
      ...res.locals.validated,
      [target]: result.data,
    };

    return next();
  };
}
