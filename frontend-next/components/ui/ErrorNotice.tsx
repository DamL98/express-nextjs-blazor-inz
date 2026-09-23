"use client";

import { AppIcon } from "@/components/ui/AppIcon";

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p className="font-semibold"><AppIcon name="circle-alert" />Nie udało się wczytać danych</p>

      <p className="mt-1 break-words">
        {message}
      </p>

      <button type="button"
        onClick={() => window.location.reload()}
        className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 font-medium hover:bg-red-50">
        <AppIcon name="refresh-cw" />Spróbuj ponownie
      </button>

    </div>
  );
}
