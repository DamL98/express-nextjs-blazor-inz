import { API_URL } from "@/lib/config/env";
import type { ApiSuccess, ProblemDetails } from "./api-response.types";

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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json, application/problem+json");
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    credentials: "include",
    headers,
  });

  const text = await response.text();
  let body: ApiSuccess<T> | ProblemDetails | undefined;

  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    /* TODO Preserve HTTP errors even for non-JSON responses. */
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("api-session-expired"));
    throw new ApiClientError({
      type: "about:blank",
      title: `Blad API HTTP ${response.status}`,
      ...(body && typeof body === "object" ? body : {}),
      status: response.status,
    });
  }

  if (response.status === 204) return undefined as T;
  if (!body || !("success" in body) || body.success !== true || !("data" in body)) throw new Error("Nieprawidlowa odpowiedz API");

  return body.data;
}
