import { AppIcon } from "@/components/ui/AppIcon";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-app-line bg-white px-6 py-12 text-center">
      <span aria-hidden="true" className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700"><AppIcon name="calendar-days" className="size-6" /></span>

      <h2 className="text-lg font-semibold text-app-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-app-muted">
        {description}
      </p>

      {children && <div className="mt-5">{children}</div>}

    </div>
  );
}
