import { z } from "../../config/zod.js";
import {
  registerSchema, loginSchema, emailSchema, tokenSchema,
  resetPasswordSchema, changePasswordSchema, linkGoogleSchema,
} from "./auth.validation.js";
import {
  successResponse, jsonRequestBody, sessionSecurity, problemResponse,
  rateLimitResponse, redirectResponse, sessionResponseSchema, userResponseSchema,
  messageResponseSchema, authorizationUrlResponseSchema, oauthCallbackQuerySchema,
} from "../documentation/documentation.schemas.js";

export function registerAuthDocumentation(registry) {
  // Pipeline normalizuje e-mail przed walidacją. Dokumentujemy jego końcowe
  // ograniczenia bez ponownego definiowania długości i formatu adresu.
  const documentedEmailSchema = loginSchema.shape.email.out;
  const documentedLoginSchema = loginSchema.extend({ email: documentedEmailSchema });
  const documentedRegisterSchema = registerSchema.extend({ email: documentedEmailSchema });
  const documentedEmailRequestSchema = emailSchema.extend({ email: documentedEmailSchema });

  const localOperations = [
    ["/register", "Rejestracja lokalna i wysłanie potwierdzenia", documentedRegisterSchema, messageResponseSchema, false],
    ["/login", "Logowanie lokalne", documentedLoginSchema, sessionResponseSchema, false],
    ["/verification/request", "Ponowne wysłanie potwierdzenia e-mail", documentedEmailRequestSchema, messageResponseSchema, false],
    ["/verify-email", "Potwierdzenie adresu e-mail", tokenSchema, messageResponseSchema, false],
    ["/password/forgot", "Wysłanie linku resetującego hasło", documentedEmailRequestSchema, messageResponseSchema, false],
    ["/password/reset", "Ustawienie hasła na podstawie tokenu", resetPasswordSchema, messageResponseSchema, false],
    ["/password/change", "Zmiana hasła zalogowanego użytkownika", changePasswordSchema, sessionResponseSchema, true],
    ["/google/link", "Rozpoczęcie łączenia konta Google", linkGoogleSchema, authorizationUrlResponseSchema, true],
  ];

  for (const [path, summary, bodySchema, responseSchema, requiresSession] of localOperations) {
    registry.registerPath({
      method: "post",
      path: `/api/v1/auth${path}`,
      tags: ["Uwierzytelnianie"],
      summary,
      security: requiresSession ? sessionSecurity : [],
      request: {
        body: jsonRequestBody(bodySchema)
      },
      responses: {
        200: successResponse(responseSchema),
        429: rateLimitResponse,
        default: problemResponse
      },
    });
  }

  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/session",
    tags: ["Uwierzytelnianie"],
    summary: "Utworzenie sesji na podstawie danych Google",
    description: "Przekaż idToken w body lub Authorization: Bearer (token Google), albo authorizationCode. redirectUri jest opcjonalne",
    request: {
      headers: z.object({ authorization: z.string().optional() }),
      body: {
        required: false,
        content: {
          "application/json": {
            schema: z.object({
              idToken: z.string().optional(),
              authorizationCode: z.string().optional(),
              redirectUri: z.url().optional(),
            })
          }
        },
      },
    },
    responses: {
      200: successResponse(sessionResponseSchema),
      default: problemResponse
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/me",
    tags: ["Uwierzytelnianie"],
    summary: "Profil zalogowanego użytkownika",
    security: sessionSecurity,
    responses: {
      200: successResponse(userResponseSchema),
      default: problemResponse
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/logout",
    tags: ["Uwierzytelnianie"],
    summary: "Usunięcie cookie sesji",
    description: "Nie unieważnia już wydanego tokenu Bearer.",
    responses: {
      200: successResponse(z.object({ loggedOut: z.boolean() })),
      default: problemResponse
    },
  });

  for (const [path, summary, response] of [
    ["/google/url", "Adres logowania Google", successResponse(authorizationUrlResponseSchema)],
    ["/google/start", "Przekierowanie do logowania Google", redirectResponse],
  ]) {
    registry.registerPath({
      method: "get",
      path: `/api/v1/auth${path}`,
      tags: ["Uwierzytelnianie"],
      summary,
      request: {
        query: z.object({ redirectTo: z.url().optional() })
      },
      responses: {
        [path.endsWith("url") ? 200 : 302]: response,
        default: problemResponse
      },
    });
  }

  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/google/callback",
    tags: ["Uwierzytelnianie"],
    summary: "Callback logowania lub łączenia Google",
    request: {
      query: oauthCallbackQuerySchema
    },
    responses: {
      302: redirectResponse,
      default: problemResponse
    },
  });
}
