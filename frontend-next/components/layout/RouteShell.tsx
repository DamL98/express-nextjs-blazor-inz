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
      <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-[430px] rounded-[22px] border border-blue-900/20 bg-white/[.97] p-[38px] text-[var(--app-ink)] shadow-[0_24px_70px_rgba(23,32,51,0.14)] max-[480px]:px-[22px] max-[480px]:py-7">Ładowanie sesji..</div>
      </main>
    );
  }

  if (isLoginPage) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
