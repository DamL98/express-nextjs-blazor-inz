import { getApplicationEnvironment, getGoogleOAuthEnvironment } from "../config/environment.js";
import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

export function csrfProtection(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");

  // Swagger UI korzysta z jawnie skonfigurowanego originu API, nie z headera Hosta
  const allowed = [
    ...getGoogleOAuthEnvironment().allowedFrontendOrigins,
    getApplicationEnvironment().apiPublicUrl,
  ].map((value) => new URL(value).origin);

  if (origin) return allowed.includes(origin) ? next() : next(new ApiError(Problems.FORBIDDEN));

  if (req.get("sec-fetch-site") === "cross-site") {
    return next(new ApiError(Problems.FORBIDDEN));
  }

  // formularze z obcych URL nie mogą wysłać JSON bez kontroli CORS
  if (!req.is("application/json")
     && !req.get("authorization")
     && (req.get("cookie")
     || req.get("sec-fetch-site"))
    ) {
    return next(new ApiError(Problems.FORBIDDEN));
  }

  return next();
}
