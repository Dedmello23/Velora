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
  Palette,
  Bell,
  Maximize,
  User,
  Settings,
  Check,
  Layers,
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("velora_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("velora_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
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
      className={`flex min-h-dvh transition-colors duration-200 overflow-x-hidden ${
        theme === "dark"
          ? "bg-zinc-950 text-zinc-100 dark"
          : theme === "gradient"
          ? "bg-gradient-to-br from-slate-950 via-indigo-950/80 to-zinc-950 text-zinc-100 dark"
          : theme === "og"
          ? "bg-transparent text-zinc-100 dark"
          : "bg-zinc-50/70 text-zinc-900"
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
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-200 md:static ${
          collapsed ? "md:w-16" : "md:w-72"
        } w-72 ${
          theme === "og"
            ? "border-zinc-800/60 bg-zinc-950/85 backdrop-blur-md text-zinc-100"
            : theme === "dark" || theme === "gradient"
            ? "border-zinc-800/80 bg-zinc-900/95 backdrop-blur-md text-zinc-100"
            : "border-zinc-200 bg-white text-zinc-900"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Clean Logo Header Space */}
        <div
          className={`flex h-16 items-center px-4 border-b transition-all ${
            collapsed ? "justify-center" : "justify-between"
          } ${
            theme === "og"
              ? "border-zinc-800/60 bg-zinc-950/50"
              : theme === "dark" || theme === "gradient"
              ? "border-zinc-800/80"
              : "border-zinc-100"
          }`}
        >
          <Link href="/" className="flex items-center justify-center w-full overflow-hidden">
            <BrandLogo collapsed={collapsed} />
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
          {!collapsed && (
            <div className="mb-2 px-3 text-[10px] font-semibold tracking-wider opacity-40 uppercase">
              Menu
            </div>
          )}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                  } ${
                    active
                      ? theme === "gradient"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                      : theme === "dark" || theme === "gradient" || theme === "og"
                      ? "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? theme === "gradient"
                            ? "text-white"
                            : "text-white dark:text-zinc-900"
                          : "opacity-60 group-hover:opacity-100"
                      }`}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0 min-h-dvh overflow-x-hidden">
        {/* Top Header Bar */}
        <header
          className={`sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b px-3 sm:px-6 backdrop-blur-md transition-colors ${
            theme === "og"
              ? "border-zinc-800/60 bg-zinc-950/75 text-zinc-100"
              : theme === "dark"
              ? "border-zinc-800/80 bg-zinc-900/80 text-zinc-100"
              : theme === "gradient"
              ? "border-indigo-900/40 bg-zinc-950/70 text-zinc-100"
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
              title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
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
                    theme === "dark" || theme === "gradient" || theme === "og"
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

            {/* Theme Toggle Button */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeOpen(!themeOpen)}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl opacity-70 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Change Theme"
              >
                {theme === "light" && <Sun className="h-4 w-4 text-amber-500" />}
                {theme === "dark" && <Moon className="h-4 w-4 text-indigo-400" />}
                {theme === "gradient" && <Palette className="h-4 w-4 text-fuchsia-400" />}
                {theme === "og" && <Layers className="h-4 w-4 text-emerald-400" />}
              </button>

              {themeOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-2xl border p-1.5 shadow-lg z-50 text-xs animate-in fade-in-50 zoom-in-95 ${
                    theme === "dark" || theme === "gradient" || theme === "og"
                      ? "border-zinc-800 bg-zinc-900 text-zinc-200"
                      : "border-zinc-200 bg-white text-zinc-800"
                  }`}
                >
                  <div className="px-2 py-1 text-[9px] font-semibold opacity-40 uppercase tracking-wider">
                    Theme
                  </div>
                  {(
                    [
                      { id: "light", label: "Light", icon: Sun, color: "text-amber-500" },
                      { id: "dark", label: "Dark", icon: Moon, color: "text-indigo-400" },
                      { id: "gradient", label: "Gradient", icon: Palette, color: "text-fuchsia-400" },
                      { id: "og", label: "OG Papercut", icon: Layers, color: "text-emerald-400" },
                    ] as const
                  ).map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setThemeOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left font-medium transition-colors ${
                          theme === t.id
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${t.color}`} />
                          <span>{t.label}</span>
                        </div>
                        {theme === t.id && <Check className="h-3 w-3 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

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
                    theme === "dark" || theme === "gradient" || theme === "og"
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
                        setThemeOpen(true);
                        setProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 opacity-60" />
                      <span>Display Settings</span>
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
        <main className="flex-1 flex flex-col p-2 sm:p-4 md:p-8 max-w-5xl w-full mx-auto min-h-0">
          {children}
        </main>
      </div>

      {/* Customer Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div
            className={`w-full max-w-sm sm:max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 ${
              theme === "dark" || theme === "gradient" || theme === "og"
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
