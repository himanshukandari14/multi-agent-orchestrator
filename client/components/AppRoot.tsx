"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";

/**
 * The marketing landing at `/` is full-bleed (no app sidebar).
 * All other routes use the app shell.
 */
export function AppRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
