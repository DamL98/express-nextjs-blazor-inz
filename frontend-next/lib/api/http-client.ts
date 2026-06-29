import { API_URL } from "@/lib/config/env";
import type { ApiResponse } from "./api-response.types";

type ApiRequestOptions = RequestInit & {
  token?: string;
};

function getFallbackErrorMessage(status: number) {
  return `Błąd API - status ${status}`;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });
  } catch {
    throw new Error("Błąd łączenia z API fetch apiRequest()");
  }

  let body: ApiResponse<T>;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(getFallbackErrorMessage(response.status));
  }

  if (!response.ok || body.success === false) {
    const message =
      body.success === false
        ? body.error.message || getFallbackErrorMessage(response.status)
        : getFallbackErrorMessage(response.status);

    throw new Error(message);
  }

  return body.data;
}
