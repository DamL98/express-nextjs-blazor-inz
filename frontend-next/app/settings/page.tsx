"use client";

import { Suspense } from "react";

import { useAuth } from "@/components/auth-provider";
import { AccountSecurityCard } from "@/components/auth/AccountSecurityCard";
import { GoogleCalendarIntegrationCard } from "@/components/google-calendar/GoogleCalendarIntegrationCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingCards } from "@/components/ui/LoadingCards";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader title="Ustawienia konta" description="Zarządzaj sposobem logowania i połączeniem z Kalendarzem Google." />

      <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-app-line bg-white p-6 sm:flex-row sm:items-center">
        <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-900">{user?.fullName?.slice(0, 1).toUpperCase() || "U"}</span>

        <div className="min-w-0 flex-1">
          <h2 className="break-words text-lg font-bold">{user?.fullName}</h2>
          <p className="mt-1 break-words text-sm text-app-muted">{user?.email}</p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-app-muted">{user?.hasLocalPassword ? "Logowanie hasłem" : "Logowanie Google"}</span>

      </section>
      <Suspense fallback={<LoadingCards count={2} />}>
        <div className="space-y-6">
          <AccountSecurityCard />
          <GoogleCalendarIntegrationCard />
        </div>
      </Suspense>
    </main>
  );
}
