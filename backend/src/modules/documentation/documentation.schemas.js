import { z } from "../../config/zod.js";

// schematy odpowiedzi opisują dane zwracane przez kontrolery, nie zapisywane modele db
export const roomResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  location: z.string(),
  description: z.string().nullable(),
  capacity: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const reservationResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  roomId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  status: z.enum(["ACTIVE", "CANCELLED"]),
  googleCalendarEventId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const userResponseSchema = z.object({
  id: z.uuid(),
  sessionVersion: z.number().int(),
  googleId: z.string().nullable(),
  email: z.email(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  emailVerified: z.boolean(),
  hasLocalPassword: z.boolean(),
  lastLoginAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  role: z.object({ name: z.string() }),
});

export const sessionResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.string(),
  user: userResponseSchema,
});

export const messageResponseSchema = z.object({ message: z.string() });
export const authorizationUrlResponseSchema = z.object({ authorizationUrl: z.url() });
export const oauthCallbackQuerySchema = z.object({
  state: z.string(),
  code: z.string().optional(),
  error: z.string().optional(),
});

export function successResponse(dataSchema, description = "Operacja zakończona powodzeniem") {
  return {
    description,
    content: {
      "application/json": {
        schema: z.object({ success: z.literal(true), data: dataSchema }),
      },
    },
  };
}

export function jsonRequestBody(bodySchema) {
  return { required: true, content: { "application/json": { schema: bodySchema } } };
}

export const sessionSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }];

export const redirectResponse = {
  description: "Przekierowanie OAuth. Callback wymaga cookie i stanu rozpoczętego flow",
  headers: {
    Location: {
      schema: {
        type: "string",
        format: "uri"
      }
    }
  },
};

export const problemResponse = {
  description: "Błąd API w formacie Problem Details. Pole code identyfikuje problem, a type opis",
  content: {
    "application/problem+json": {
      schema: z.object({
        type: z.string(),
        title: z.string(),
        status: z.number().int(),
        detail: z.string(),
        instance: z.string(),
        code: z.string(),
        errors: z.unknown().optional(),
      }),
    },
  },
};

export const rateLimitResponse = {
  ...problemResponse,
  description: "Przekroczono limit operacji uwierzytelniania: 30 requestów na 15 minut",
  headers: { "Retry-After": {
    schema: {
      type: "integer"
    },
    description: "Czas oczekiwania w sekundach" }
  },
};
