export function validate(schema, target = "query") {
  return async (req, res, next) => {
    const validData = await schema.parseAsync(req[target]);

    res.locals.validated = {
      ...res.locals.validated,
      [target]: validData,
    };

    return next();
  };
}

//Dlaczego res.locals?
// Bo jest przeznaczone na dane lokalne dla cyklu życia requestu.
// Nie modyfikujemy wbudowanych pól Expressa takich jak req.query.