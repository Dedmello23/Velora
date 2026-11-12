"use client";

import { useState } from "react";
import { ShoppingBag, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Authentication failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50/70 p-4 antialiased text-zinc-900">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white p-7 shadow-xs">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-2xs mb-3">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">
            Velora · ShopEase
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Enter team access passcode to open the customer support portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Team Passcode
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-xl border border-zinc-300/80 bg-zinc-50/50 px-3.5 py-2.5 pl-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 transition-all min-h-[44px]"
                placeholder="Enter passcode"
                autoFocus
              />
              <Lock className="absolute left-3 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !passcode}
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-zinc-800 active:bg-black disabled:opacity-40 transition-all"
          >
            <span>{loading ? "Verifying..." : "Access Portal"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>SRM Hackathon Protected Demo</span>
          </div>
        </div>
      </div>
    </main>
  );
}
