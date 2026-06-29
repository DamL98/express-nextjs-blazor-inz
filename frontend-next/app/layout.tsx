import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { RouteShell } from "@/components/layout/RouteShell";

export const metadata: Metadata = {
  title: "System rezerwacji sal",
  description: "App do rezerwacji sal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <RouteShell>{children}</RouteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
