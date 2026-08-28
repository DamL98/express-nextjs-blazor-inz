import { Router } from "express";

import { Problems } from "./problems.js";

const router = Router();

router.get("/:slug", (req, res, next) => {
  const type = `/problems/${req.params.slug}`;
  const definition = Object.values(Problems).find(
    (problem) => problem.type === type,
  );

  if (!definition) {
    return next();
  }

  return res
    .type("html")
    .send(`<!doctype html>
      <html lang="pl">
        <head><meta charset="utf-8"><title>${definition.title}</title></head>
        <body>
          <main>
            <h1>${definition.title}</h1>
            <dl>
              <dt>Type</dt><dd><code>${definition.type}</code></dd>
              <dt>HTTP status</dt><dd>${definition.status}</dd>
              <dt>Code</dt><dd><code>${definition.code}</code></dd>
              <dt>Default detail</dt><dd>${definition.detail}</dd>
            </dl>
          </main>
        </body>
      </html>`);
});

export default router;
