"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AppIcon, type IconName } from "@/components/ui/AppIcon";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="border-b border-app-line bg-white px-4 py-4 md:px-8">

      <div className="flex items-center justify-between gap-3">
        <p className="hidden text-sm text-app-muted sm:block">Wszystko gotowe na Twoje spotkanie</p>
        <p className="text-sm font-semibold sm:hidden">System rezerwacji</p>

        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-900 sm:grid">
            {user?.fullName?.slice(0, 1).toUpperCase() || "U"}
          </span>

          <div className="hidden min-w-0 lg:block">
            <p className="max-w-52 truncate text-sm font-semibold">{user?.fullName}</p>
            <p className="max-w-52 truncate text-xs text-app-muted">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="min-h-11 rounded-xl border border-app-line px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <AppIcon name="log-out" />
            Wyloguj
          </button>

        </div>
      </div>

      <nav aria-label="Nawigacja mobilna" className="mt-4 grid grid-cols-2 gap-2 border-t border-app-line pt-4 sm:grid-cols-4 md:hidden">
        {[
          { href: "/", label: "Przegląd", icon: "layout-dashboard" },
          { href: "/rooms", label: "Sale", icon: "building-2" },
          { href: "/reservations", label: "Moje rezerwacje", icon: "calendar-days" },
          { href: "/settings", label: "Ustawienia", icon: "settings" },
        ].map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link prefetch={false} key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-3 text-center text-xs font-semibold ${active ? "bg-blue-900 text-white" : "bg-slate-50 text-app-muted"}`}
            >
              <AppIcon name={item.icon as IconName} />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </header>
  );
}
