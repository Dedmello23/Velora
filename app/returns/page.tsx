"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";

type Return = {
  id: number;
  order_id: number;
  product_name: string;
  reason: string;
  status: string;
  created_at: string;
};
type Ticket = {
  id: number;
  order_id: number | null;
  issue: string;
  priority: string;
  status: string;
  created_at: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function ReturnsPage() {
  const [data, setData] = useState<{ returns: Return[]; tickets: Ticket[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/returns", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (alive) {
          setData(json);
          setError("");
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      <AppHeader />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {!data && !error && <p className="text-sm text-slate-500">Loading…</p>}

      {data && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Returns</h2>
          {data.returns.length === 0 && <p className="mb-4 text-sm text-slate-500">No returns yet.</p>}
          <ul className="mb-6 space-y-3">
            {data.returns.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    Return #{r.id} · {r.product_name}
                  </span>
                  <StatusBadge value={r.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Order #{r.order_id} · {fmt(r.created_at)}
                </p>
                <p className="mt-2 text-sm">{r.reason}</p>
              </li>
            ))}
          </ul>

          <h2 className="mb-2 text-sm font-semibold text-slate-700">Support tickets</h2>
          {data.tickets.length === 0 && <p className="text-sm text-slate-500">No tickets yet.</p>}
          <ul className="space-y-3">
            {data.tickets.map((t) => (
              <li key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">Ticket #{t.id}</span>
                  <span className="flex gap-1">
                    <StatusBadge value={t.priority} />
                    <StatusBadge value={t.status} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t.order_id ? `Order #${t.order_id} · ` : ""}
                  {fmt(t.created_at)}
                </p>
                <p className="mt-2 text-sm">{t.issue}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
