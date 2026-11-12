"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Support Chat" },
  { href: "/orders", label: "My Orders" },
  { href: "/returns", label: "My Returns" },
  { href: "/admin", label: "Admin" },
];

export default function AppHeader() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">ShopEase · Customer Support</h1>
          <p className="text-xs sm:text-sm text-slate-500">Signed in as <span className="font-medium text-slate-700">Priya Raman (C001)</span></p>
        </div>
        <button
          onClick={logout}
          className="min-h-[40px] px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 active:text-black rounded-lg hover:bg-slate-100 transition-colors"
        >
          Log out
        </button>
      </div>
      <nav className="mt-3 flex gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`-mb-px flex items-center min-h-[42px] border-b-2 px-3.5 py-2 text-xs sm:text-sm whitespace-nowrap transition-colors ${
              pathname === l.href
                ? "border-slate-900 font-semibold text-slate-900"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
