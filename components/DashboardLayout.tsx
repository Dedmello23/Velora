"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import BrandLogo from "@/components/BrandLogo";
import {
  PanelLeft,
  Bot,
  Package,
  RotateCcw,
  ShieldAlert,
  LogOut,
  X,
  Sun,
  Moon,
  Bell,
  Maximize,
  User,
  Settings,
  Check,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const NAV_ITEMS = [
  {
    href: "/",
    label: "Support Agent",
    icon: Bot,
    description: "Interactive customer assistance",
  },
  {
    href: "/orders",
    label: "My Orders",
    icon: Package,
    description: "Track shipment & history",
  },
  {
    href: "/returns",
    label: "Returns & Tickets",
    icon: RotateCcw,
    description: "Manage claims & disputes",
  },
  {
    href: "/admin",
    label: "Admin Queue",
    icon: ShieldAlert,
    description: "Escalated support tickets",
  },
];

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [hovered, setHovered] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverSuppressedRef = useRef(false);
  const compact = collapsed && !hovered && !mobileOpen;
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("velora_sidebar_pinned");
    if (saved === "true") setCollapsed(false);
  }, []);

  // Small intent delays so a mouse passing by doesn't flicker the sidebar
  const setHoverDelayed = (value: boolean) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (value && hoverSuppressedRef.current) return;
    if (!value) hoverSuppressedRef.current = false;
    hoverTimerRef.current = setTimeout(() => setHovered(value), value ? 90 : 160);
  };

  // After picking a page, fold the sidebar away at once; it re-opens on the next hover.
  const handleNavClick = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverSuppressedRef.current = true;
    setHovered(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("velora_sidebar_pinned", String(!next));
      return next;
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    localStorage.removeItem("velora_theme");
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <div
      className={`flex min-h-dvh overflow-x-hidden transition-colors duration-200 ${
        theme === "dark" ? "dark bg-zinc-950 text-zinc-100" : "bg-zinc-50/70 text-zinc-900"
      }`}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      {/* Spacer reserves layout width so hover-expansion overlays content */}
      <div
        aria-hidden
        className={`hidden md:block shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          collapsed ? "w-16" : "w-72"
        }`}
      />
      <aside
        onMouseEnter={() => setHoverDelayed(true)}
        onMouseLeave={() => setHoverDelayed(false)}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r transition-[width,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          compact ? "md:w-16" : "md:w-72"
        } ${collapsed && !compact && !mobileOpen ? "md:shadow-2xl" : ""} w-72 ${
          theme === "dark"
            ? "border-zinc-800/80 bg-zinc-900/95 backdrop-blur-md text-zinc-100"
            : "border-zinc-200 bg-white text-zinc-900"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Clean Logo Header Space */}
        <div
          className={`flex h-16 shrink-0 items-center gap-2 px-4 border-b ${
            theme === "dark" ? "border-zinc-800/80" : "border-zinc-100"
          }`}
        >
          <Link href="/" className="relative h-10 min-w-0 flex-1 overflow-hidden">
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                compact ? "opacity-100 delay-100" : "opacity-0"
              }`}
            >
              <BrandLogo collapsed />
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                compact ? "opacity-0" : "opacity-100 delay-100"
              }`}
            >
              <BrandLogo collapsed={false} />
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden rounded-lg p-1.5 opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links (Clean: Badges removed) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <div key={item.href}>
                  {item.href === "/admin" && (
                    <div className="mx-3 my-2 border-t border-zinc-200 dark:border-zinc-800" />
                  )}
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex h-10 items-center rounded-lg px-3.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute -left-2.5 bottom-2 top-2 w-[3px] rounded-r-full bg-zinc-900 dark:bg-white" />
                    )}
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span
                        className={`transition-opacity duration-200 ${
                          compact ? "opacity-0" : "opacity-100 delay-100"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Signed-in customer */}
        <div className="shrink-0 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
              PR
            </div>
            <div
              className={`min-w-0 leading-tight transition-opacity duration-200 ${
                compact ? "opacity-0" : "opacity-100 delay-100"
              }`}
            >
              <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-white">Priya Raman</p>
              <p className="text-xs text-zinc-500">Customer · C001</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0 min-h-dvh overflow-x-hidden">
        {/* Top Header Bar */}
        <header
          className={`sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b px-3 sm:px-6 backdrop-blur-md transition-colors ${
            theme === "dark"
              ? "border-zinc-800/80 bg-zinc-900/80 text-zinc-100"
              : "border-zinc-200 bg-white/90 text-zinc-900"
          }`}
        >
          {/* Left: Sidebar Toggle Button */}
          <div className="flex items-center min-w-0">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileOpen(!mobileOpen);
                } else {
                  toggleCollapsed();
                }
              }}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 opacity-80 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-2xs"
              title={collapsed ? "Pin sidebar open" : "Unpin sidebar"}
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl opacity-70 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-0 right-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 px-0.5 text-[8px] font-black text-white dark:text-zinc-900">
                  3
                </span>
              </button>

              {notificationsOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl border p-3 shadow-lg z-50 text-xs animate-in fade-in-50 zoom-in-95 ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900 text-zinc-200"
                      : "border-zinc-200 bg-white text-zinc-800"
                  }`}
                >
                  <div className="font-semibold pb-1.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                    <span>Updates</span>
                    <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 mt-1.5 space-y-1">
                    <div className="py-1">
                      <p className="font-medium">Order #1007 Delivered</p>
                      <p className="text-[10px] opacity-60">Eligible for return</p>
                    </div>
                    <div className="py-1">
                      <p className="font-medium">Order #1003 Delayed</p>
                      <p className="text-[10px] opacity-60">4 days late</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl opacity-70 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl opacity-70 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-indigo-400" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative ml-0.5" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 rounded-2xl p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-hidden"
              >
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-600 text-white font-bold text-xs shadow-xs border border-zinc-200 dark:border-zinc-700">
                  PR
                </div>
              </button>

              {profileOpen && (
                <div
                  className={`absolute right-0 mt-2 w-60 sm:w-64 rounded-2xl border p-2 shadow-xl z-50 text-xs animate-in fade-in-50 zoom-in-95 ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900 text-zinc-200"
                      : "border-zinc-200 bg-white text-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-2.5 border border-zinc-100 dark:border-zinc-800 mb-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-600 text-white font-bold text-xs shadow-xs">
                      PR
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-xs text-zinc-900 dark:text-white">
                        Priya Raman
                      </p>
                      <p className="truncate text-[10px] opacity-60">
                        priya.raman@example.com
                      </p>
                    </div>
                  </div>

                  <div className="py-0.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <User className="h-3.5 w-3.5 opacity-60" />
                      <span>Profile (C001)</span>
                    </button>

                    <button
                      onClick={() => {
                        toggleTheme();
                        setProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 opacity-60" />
                      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                    </button>
                  </div>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main key={pathname} className="animate-in fade-in-50 duration-200 flex-1 flex flex-col p-2 sm:p-4 md:p-8 max-w-5xl w-full mx-auto min-h-0">
          {children}
        </main>
      </div>

      {/* Customer Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div
            className={`w-full max-w-sm sm:max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900 text-zinc-100"
                : "border-zinc-200 bg-white text-zinc-900"
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm sm:text-base">Customer Account</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="rounded-lg p-1 opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-600 text-white font-bold text-lg shadow-md">
                PR
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">Priya Raman</h4>
                <p className="text-xs opacity-60">Verified Customer · C001</p>
              </div>
            </div>

            <div className="space-y-2 text-xs divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="pt-2 flex justify-between">
                <span className="opacity-60">Customer ID</span>
                <span className="font-mono font-bold">C001</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="opacity-60">Email</span>
                <span className="font-medium truncate ml-2">priya.raman@example.com</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="opacity-60">City</span>
                <span className="font-medium">Chennai, India</span>
              </div>
            </div>

            <button
              onClick={() => setProfileModalOpen(false)}
              className="mt-5 w-full rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-2.5 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
