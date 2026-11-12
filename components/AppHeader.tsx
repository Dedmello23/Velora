"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Support Chat" },
  { href: "/orders", label: "My Orders" },
  { href: "/returns", label: "My Returns" },
];

export default function AppHeader() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">ShopEase · Customer Support</h1>
          <p className="text-sm text-slate-500">Signed in as Priya Raman (C001)</p>
        </div>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">
          Log out
        </button>
      </div>
      <nav className="mt-3 flex gap-1 border-b border-slate-200">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              pathname === l.href
                ? "border-slate-900 font-medium text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
