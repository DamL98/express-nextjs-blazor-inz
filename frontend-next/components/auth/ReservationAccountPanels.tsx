"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AccountSecurityCard } from "./AccountSecurityCard";
import { GoogleCalendarIntegrationCard } from "@/components/google-calendar/GoogleCalendarIntegrationCard";

export function ReservationAccountPanels() {
  const searchParams = useSearchParams();
  const hasCallback = searchParams.has("googleLink") || searchParams.has("googleCalendar");

  return (
    <details open={hasCallback || undefined} className="mt-8 rounded-2xl border border-app-line bg-white p-5">
      <summary className="cursor-pointer rounded-lg text-sm font-semibold text-app-ink">Konto i integracja kalendarza</summary>
      <p className="mt-3 text-sm leading-6 text-app-muted">Ustawienia na osobnej stronie <Link prefetch={false} href="/settings" className="font-medium text-blue-700 underline">Przejdź do ustawień</Link></p>
      <div className="mt-5 space-y-5">
        <AccountSecurityCard />
        <GoogleCalendarIntegrationCard />
      </div>
    </details>
  );
}
