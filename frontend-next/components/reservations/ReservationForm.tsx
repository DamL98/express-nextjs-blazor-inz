"use client";


import { AppIcon } from "@/components/ui/AppIcon";
import { type SubmitEvent, useState } from "react";
import Link from "next/link";

import {
  apiRequest,
  type Reservation,
  type RoomAvailability,
} from "@/lib/api";


type ReservationFormProps = {
  roomId: string;
  roomName: string;
};

type FormState = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
};

const initialState: FormState = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
};

function toISOStringFromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

function validateForm(form: FormState): string | null {
  if (!form.title.trim()) {
    return "Tytuł jest wymagany";
  }

  if (!form.startTime) {
    return "Początek rezerwacji jest wymagany";
  }

  if (!form.endTime) {
    return "Koniec rezerwacji jest wymagany";
  }

  const start = new Date(form.startTime);
  const end = new Date(form.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Podaj poprawny zakres czasu";
  }

  if (start >= end) {
    return "Początek musi być wcześniej niż koniec";
  }

  return null;
}

export function ReservationForm({ roomId, roomName }: ReservationFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [submittedForm, setSubmittedForm] = useState<FormState | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const start = form.startTime ? new Date(form.startTime) : null;
  const end = form.endTime ? new Date(form.endTime) : null;
  const duration = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
  const invalidRange = Boolean(start && end && duration <= 0);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Skrót czasu zmienia tylko lokalne pola formularza.
  function setDuration(minutes: number) {
    if (!start || Number.isNaN(start.getTime())) return;

    const nextEnd = new Date(start.getTime() + minutes * 60000);
    const localEnd = new Date(nextEnd.getTime() - nextEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm((current) => ({ ...current, endTime: localEnd }));
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setHasSubmitted(true);

    const validationError = validateForm(form);

    if (validationError) {
      setErrorMessage(validationError);
      const field = !form.title.trim() ? "title" : !form.startTime ? "startTime" : "endTime";
      event.currentTarget.querySelector<HTMLInputElement>(`#${field}`)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const startTime = toISOStringFromLocalInput(form.startTime);
      const endTime = toISOStringFromLocalInput(form.endTime);
      const query = new URLSearchParams({
        start: startTime,
        end: endTime,
      });
      const availability = await apiRequest<RoomAvailability>(
        `/rooms/${encodeURIComponent(roomId)}/availability?${query.toString()}`,
      );

      if (!availability.available) {
        setErrorMessage("Sala jest niedostępna w wybranym terminie. Wybierz inne godziny i spróbuj ponownie.");
        return;
      }

      await apiRequest<Reservation>("/reservations", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startTime,
          endTime,
        }),
      });

      setSubmittedForm({ ...form });
      setHasSubmitted(false);
      setForm(initialState);
      setSuccessMessage("Rezerwacja utworzona");

    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się utworzyć rezerwacji";
      setErrorMessage(message);

    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-app-line bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Zaplanuj spotkanie</p>
      <h2 className="mt-2 text-xl font-bold"><AppIcon name="calendar-plus" />Zarezerwuj salę</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">Wybierz termin i nadaj spotkaniu nazwę. Dostępność sprawdzimy przy zapisie.</p>

      {successMessage && submittedForm && (
        <div role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-5 text-sm text-teal-900">

          <p className="font-bold">{successMessage}</p>
          <p className="mt-2 break-words">{submittedForm.title} — {roomName}</p>
          <p className="mt-1">{new Date(submittedForm.startTime).toLocaleString("pl-PL")} — {new Date(submittedForm.endTime).toLocaleString("pl-PL")}</p>

          <div className="mt-3 flex flex-wrap gap-4">
            <Link prefetch={false} href="/reservations" className="inline-block font-semibold underline">Przejdź do moich rezerwacji</Link>
            <button type="button" onClick={() => { setSuccessMessage(null); document.getElementById("startTime")?.focus(); }} className="font-semibold underline">Nowa rezerwacja</button>
          </div>

        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-describedby="reservation-timezone">
        <fieldset disabled={isSubmitting} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Dane nowej rezerwacji</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium">Początek</label>
              <input id="startTime" type="datetime-local" required value={form.startTime} onChange={(event) => updateField("startTime", event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-app-line px-3 py-2 text-sm" />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium">Koniec</label>
              <input id="endTime" type="datetime-local" required value={form.endTime} aria-invalid={invalidRange} aria-describedby={invalidRange ? "reservation-range-error" : undefined} onChange={(event) => updateField("endTime", event.target.value)} className={`mt-2 min-h-11 w-full rounded-xl border px-3 py-2 text-sm ${invalidRange ? "border-red-400" : "border-app-line"}`} />
            </div>
          </div>

          {invalidRange && <p id="reservation-range-error" role="alert" className="text-sm text-red-700">Koniec musi przypadać po początku rezerwacji.</p>}

          <div>
            <p className="text-xs font-medium text-app-muted"><AppIcon name="clock" />Szybki wybór czasu trwania</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[{ minutes: 30, label: "30 min" }, { minutes: 60, label: "1 godz." }, { minutes: 120, label: "2 godz." }].map((option) => (
                <button key={option.minutes} type="button" disabled={!start} aria-pressed={duration === option.minutes} onClick={() => setDuration(option.minutes)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${duration === option.minutes ? "border-blue-300 bg-blue-50 text-blue-800" : "border-app-line hover:bg-slate-50"}`}>{option.label}</button>
              ))}
            </div>

            {!start && <p className="mt-2 text-xs text-app-muted">Najpierw wybierz początek spotkania.</p>}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium">Nazwa rezerwacji</label>
            <input id="title" type="text" required value={form.title} aria-invalid={hasSubmitted && !form.title.trim()} aria-describedby={hasSubmitted && !form.title.trim() ? "reservation-title-error" : undefined} onChange={(event) => updateField("title", event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-app-line px-3 py-2 text-sm" placeholder="Np. spotkanie zespołu projektowego" />

            {hasSubmitted && !form.title.trim() && <p id="reservation-title-error" className="mt-2 text-sm text-red-700">Wpisz nazwę spotkania.</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">Opis <span className="font-normal text-app-muted">(opcjonalnie)</span></label>
            <textarea id="description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="mt-2 min-h-24 w-full rounded-xl border border-app-line px-3 py-2 text-sm"
              placeholder="Cel spotkania lub dodatkowe informacje" />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="break-words text-sm font-semibold text-blue-950">{roomName}</p>
            <p className="mt-2 text-sm text-app-muted">{duration > 0 ? `Czas trwania: ${duration} min` : "Wybierz początek i koniec spotkania."}</p>
            <p id="reservation-timezone" className="mt-2 text-xs text-app-muted">Strefa czasu: {timeZone}. Termin zostanie potwierdzony po zapisaniu.</p>
          </div>

          {errorMessage && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>}

          <button type="submit" disabled={isSubmitting || invalidRange} className="min-h-12 w-full rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            <AppIcon name="calendar-plus" />{isSubmitting ? "Tworzenie…" : "Utwórz rezerwację"}
          </button>

        </fieldset>
      </form>
    </section>
  );
}
