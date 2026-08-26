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
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json, application/problem+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = (await response.json()) as ApiSuccess<T> | ProblemDetails;

  if (!response.ok) {
    throw new ApiClientError(body as ProblemDetails);
  }

  return (body as ApiSuccess<T>).data;
}
