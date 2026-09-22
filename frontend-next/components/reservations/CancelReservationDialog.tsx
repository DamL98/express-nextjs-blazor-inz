"use client";

import { useEffect, useRef } from "react";

import type { Reservation } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";

type CancelReservationDialogProps = {
  reservation: Reservation;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelReservationDialog({ reservation, busy, error, onClose, onConfirm }: CancelReservationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;

    dialog?.showModal();

    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      } else {
        document.getElementById("reservation-search")?.focus();
      }
    };
  }, []);

  return (
    <dialog ref={dialogRef} onCancel={(event) => {
      event.preventDefault();
      if (!busy) onClose();
      }} aria-labelledby="cancel-title" aria-describedby="cancel-description" aria-busy={busy} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-app-line bg-white p-6 text-app-ink shadow-xl backdrop:bg-slate-950/50 sm:p-8">

      <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Anulowanie spotkania</p>
      <h2 id="cancel-title" className="mt-3 text-2xl font-bold">Anulować tę rezerwację?</h2>

      <p id="cancel-description" className="mt-3 text-sm leading-6 text-app-muted">Zwolnisz termin dla innych osób. Konieczne będzie utworzenie nowej rezerwacji.</p>

      <div className="my-6 rounded-xl bg-slate-50 p-4">
        <p className="break-words font-semibold">{reservation.title}</p>
        <p className="mt-1 break-words text-sm text-app-muted">{reservation.room?.name ?? "Wybrana sala"}</p>
        <p className="mt-2 text-sm text-app-muted">{formatDateTime(reservation.startTime)} — {formatDateTime(reservation.endTime)}</p>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" autoFocus disabled={busy} onClick={onClose} className="rounded-xl border border-app-line px-4 py-3 text-sm font-semibold hover:bg-slate-50">Zachowaj rezerwację</button>
        <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800">{busy ? "Anulowanie…" : "Anuluj rezerwację"}</button>
      </div>

    </dialog>
  );
}
