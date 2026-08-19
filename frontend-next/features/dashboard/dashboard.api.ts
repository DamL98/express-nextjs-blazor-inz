import { apiRequest } from "@/lib/api/http-client";
import type { Dashboard } from "./dashboard.types";

export function getDashboard(signal?: AbortSignal): Promise<Dashboard> {
  return apiRequest<Dashboard>("/dashboard", {
    cache: "no-store",
    signal,
  });
}
