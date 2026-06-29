import { API_URL } from "@/lib/config/env";
import type { ApiResponse } from "./api-response.types";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || body.success === false) {
    const message =
      body.success === false ? body.error.message : "Błąd API";

    throw new Error(message);
  }

  return body.data;
}