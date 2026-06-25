"use client";

import { useState } from "react";
import { createReservation } from "@/lib/api";

type ReservationFormProps = {
  roomId: string;
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

export function ReservationForm({ roomId }: ReservationFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await createReservation({
        roomId,
        title: form.title,
        description: form.description || undefined,
        startTime: toISOStringFromLocalInput(form.startTime),
        endTime: toISOStringFromLocalInput(form.endTime),
      });

      setForm(initialState);
      setSuccessMessage("Rezerwacja została utworzona.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się utworzyć rezerwacji.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Zarezerwuj salę
      </h2>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Nazwa rezerwacji
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder=""
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Opis
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            className="mt-1 min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="Opis opcjonalny"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700"
            >
              Początek
            </label>
            <input
              id="startTime"
              type="datetime-local"
              required
              value={form.startTime}
              onChange={(event) =>
                updateField("startTime", event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700"
            >
              Koniec
            </label>
            <input
              id="endTime"
              type="datetime-local"
              required
              value={form.endTime}
              onChange={(event) => updateField("endTime", event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Tworzenie..." : "Utwórz rezerwację"}
        </button>
      </form>
    </section>
  );
}