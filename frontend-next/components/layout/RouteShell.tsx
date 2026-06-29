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
  const { user, loading } = useAuth();
  const isLoginPage = pathname === LOGIN_PATH;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && !isLoginPage) {
      router.replace(LOGIN_PATH);
      return;
    }

    if (user && isLoginPage) {
      router.replace("/");
    }
  }, [isLoginPage, loading, router, user]);

  if (loading || (!user && !isLoginPage) || (user && isLoginPage)) {
    return (
      <main className={isLoginPage ? "auth-shell login-page" : "auth-shell"}>
        <div className="auth-card">Ładowanie sesji..</div>
      </main>
    );
  }

  if (isLoginPage) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
