"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Mounted once in the root layout so the sidebar and header persist across
 * page navigation (no remount, no state reset). The login page stays bare.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return <>{children}</>;
  return <DashboardLayout>{children}</DashboardLayout>;
}
