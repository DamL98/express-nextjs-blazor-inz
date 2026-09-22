"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  label: string;
  href: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Przegląd",
    href: "/",
  },
  {
    label: "Sale",
    href: "/rooms",
  },
  {
    label: "Moje rezerwacje",
    href: "/reservations",
  },
  {
    label: "Ustawienia",
    href: "/settings",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-app-line bg-white px-5 py-8 md:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          System rezerwacji
        </p>

        <p className="mt-3 text-xl font-bold tracking-tight text-app-ink">
          Sale konferencyjne
        </p>
      </div>

      <nav aria-label="Nawigacja główna" className="mt-10 space-y-2">
        {navigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link prefetch={false}
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${active
                  ? "bg-blue-900 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="mt-2 text-xs leading-5 text-app-muted">
          Wybierz salę i zaplanuj następne spotkanie
        </p>
      </div>
    </aside>
  );
}
