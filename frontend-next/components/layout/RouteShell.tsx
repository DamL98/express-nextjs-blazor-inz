"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { AppShell } from "./AppShell";

type RouteShellProps = {
  children: ReactNode;
};

const LOGIN_PATH = "/login";

export function RouteShell({ children }: RouteShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error } = useAuth();
  const isLoginPage = pathname === LOGIN_PATH;

  useEffect(() => {
    if (loading || error) {
      return;
    }

    if (!user && !isLoginPage) {
      router.replace(LOGIN_PATH);
      return;
    }

    if (user && isLoginPage) {
      router.replace("/");
    }
  }, [isLoginPage, loading, error, router, user]);

  if (error) return <main role="alert" className="p-8">{error}</main>;

  if (loading || (!user && !isLoginPage) || (user && isLoginPage)) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-login rounded-login border border-blue-900/20 bg-white/97 p-login text-app-ink shadow-login max-login:px-login-mobile max-login:py-7">Ładowanie sesji..</div>
      </main>
    );
  }

  if (isLoginPage) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
