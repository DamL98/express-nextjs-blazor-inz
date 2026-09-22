import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">Twoja przestrzeń do spotkań</p>
        <h1 className="text-3xl font-bold tracking-tight text-app-ink">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">{description}</p>
      </div>

      {children && <div className="shrink-0">{children}</div>}

    </header>
  );
}
