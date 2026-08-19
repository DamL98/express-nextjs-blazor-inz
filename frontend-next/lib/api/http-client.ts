import { API_URL } from "@/lib/config/env";
import type { ApiSuccess, ProblemDetails } from "./api-response.types";

type ApiRequestOptions = RequestInit;
const API_REQUEST_TIMEOUT_MS = 15_000;

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
  const { headers, signal: externalSignal, ...requestOptions } = options;
  const requestController = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, API_REQUEST_TIMEOUT_MS);
  const abortRequest = () => requestController.abort(externalSignal?.reason);

  if (externalSignal?.aborted) {
    abortRequest();
  } else {
    externalSignal?.addEventListener("abort", abortRequest, { once: true });
  }

  let response: Response;
  let body: unknown;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      signal: requestController.signal,
      credentials: "include",
      headers: {
        Accept: "application/json, application/problem+json",
        "Content-Type": "application/json",
        ...(headers || {}),
      },
    });
    body = await readJson(response);
  } catch (error) {
    if (timedOut) {
      throw new ApiClientError({
        type: "/problems/api-timeout",
        title: "Przekroczono czas oczekiwania na API",
        status: 408,
        detail: "API nie odpowiedzialo w ciagu 15 sekund",
        code: "API_TIMEOUT",
      });
    }

    if (externalSignal?.aborted) {
      throw error;
    }

    throw new ApiClientError({
      type: "/problems/api-connection-error",
      title: "Blad laczenia z API",
      status: 0,
      detail: "Blad laczenia z API",
      code: "API_CONNECTION_ERROR",
    });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortRequest);
  }

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
