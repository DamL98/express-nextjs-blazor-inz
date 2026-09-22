import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-app-ink">
      <a href="#page-content" className="sr-only z-50 rounded-lg bg-white p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Przejdź do treści</a>
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <div id="page-content" tabIndex={-1} className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
