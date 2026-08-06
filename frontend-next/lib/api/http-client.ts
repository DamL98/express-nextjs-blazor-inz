import { API_URL } from "@/lib/config/env";
import type { ApiSuccess, ProblemDetails } from "./api-response.types";

type ApiRequestOptions = RequestInit & {
  token?: string;
};

export class ApiClientError extends Error {
  readonly type: string;
  readonly status: number;
  readonly instance?: string;
  readonly code: string;
  readonly details?: unknown;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title || "Blad API");

    this.name = "ApiClientError";
    this.type = problem.type;
    this.status = problem.status;
    this.instance = problem.instance;
    this.code = problem.code || problem.type;
    this.details = problem.errors ?? problem.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return isRecord(value) &&
    typeof value.type === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "number";
}

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return isRecord(value) && value.success === true && "data" in value;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    credentials: "include",
    headers: {
      Accept: "application/json, application/problem+json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  const body = await readJson(response);

  if (!response.ok) {
    if (isProblemDetails(body)) {
      throw new ApiClientError(body);
    }

    throw new ApiClientError({
      type: "about:blank",
      title: response.statusText || "Blad API",
      status: response.status,
      detail: "API zwrocilo nieprawidlowa odpowiedz bledu",
      code: `HTTP_${response.status}`,
    });
  }

  if (!isApiSuccess<T>(body)) {
    throw new ApiClientError({
      type: "/problems/api-invalid-response",
      title: "Nieprawidlowa odpowiedz API",
      status: response.status,
      detail: "Brak oczekiwanego envelope odpowiedzi sukcesu",
      code: "API_INVALID_RESPONSE",
    });
  }

  return body.data;
}
