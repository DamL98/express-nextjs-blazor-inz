"use client";


import { AppIcon } from "@/components/ui/AppIcon";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { ReservationAccountPanels } from "@/components/auth/ReservationAccountPanels";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingCards } from "@/components/ui/LoadingCards";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ReservationsList } from "@/components/reservations/ReservationList";
import { apiRequest, type Reservation } from "@/lib/api";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Reservation[]>("/reservations/my", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) { setReservations(data); }
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) { return; }

        setError(
          loadError instanceof Error ? loadError.message : "Błąd pobierania rezerwacji",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) { setLoading(false); }
      });

    return () => controller.abort();
  }, []);

  return (
    <main
      className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10"
      data-measurement-page="reservations"
      data-measurement-state={loading ? "loading" : error ? "error" : "ready"}
      data-measurement-count={reservations.length}
    >
      <PageHeader title="Moje rezerwacje" description="Sprawdź nadchodzące spotkania, przejrzyj historię i zarządzaj swoimi terminami.">
        <Link prefetch={false} href="/rooms" className="inline-block rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"><AppIcon name="calendar-plus" />Zarezerwuj salę</Link>
      </PageHeader>

      {loading ? <LoadingCards /> : error ? <ErrorNotice message={error} /> : <ReservationsList initialReservations={reservations} />}

      <Suspense fallback={<LoadingCards count={1} />}>
        <ReservationAccountPanels />
      </Suspense>
    </main>
  );
}
