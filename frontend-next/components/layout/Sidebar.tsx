"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

type NavigationItem = {
  label: string;
  href: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
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
    label: "Admin",
    href: "/admin",
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
  const { user } = useAuth();
  const visibleNavigationItems = navigationItems.filter(
    (item) => item.href !== "/admin" || user?.role.name === "admin",
  );

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-gray-200 bg-white px-4 py-6 md:block">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          System rezerwacji
        </p>

        <h1 className="mt-2 text-lg font-bold text-gray-900">
          Sale konferencyjne
        </h1>
      </div>

      <nav className="mt-8 space-y-1">
        {visibleNavigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="mt-1 text-xs text-gray-600">
          ver. demo
        </p>
      </div>
    </aside>
  );
}
