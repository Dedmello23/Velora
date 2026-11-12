"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import { RotateCcw, AlertCircle, Clock, ShoppingBag } from "lucide-react";

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

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function ReturnsPage() {
  const [data, setData] = useState<{ returns: Return[]; tickets: Ticket[] } | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "returns" | "tickets">("all");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/returns", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load returns and tickets");
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
    <DashboardLayout
      title="Returns & Support Tickets"
      subtitle="Track your replacement and return submissions alongside human support escalations"
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300 shadow-2xs">
          ⚠️ {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          {(["all", "returns", "tickets"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition-all min-h-[36px] ${
                activeTab === tab
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xs"
                  : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              {tab === "all" ? "All Activity" : tab}
              {data && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({tab === "all"
                    ? data.returns.length + data.tickets.length
                    : tab === "returns"
                    ? data.returns.length
                    : data.tickets.length})
                </span>
              )}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
          Live refresh every 5s
        </span>
      </div>

      {/* Loading Skeleton */}
      {!data && !error && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Returns Section */}
          {(activeTab === "all" || activeTab === "returns") && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Product Returns ({data.returns.length})
                </h2>
              </div>

              {data.returns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-500 shadow-2xs">
                  No return requests active. You can request returns for eligible delivered items directly through the AI Support Agent.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.returns.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 block">
                              {r.product_name}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Return ID #{r.id} · Linked to Order #{r.order_id}
                            </span>
                          </div>
                        </div>

                        <StatusBadge value={r.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          Requested: {fmt(r.created_at)}
                        </span>
                      </div>

                      <div className="mt-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 p-3 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-100/80 dark:border-zinc-700/80">
                        <span className="font-semibold text-zinc-500 block mb-0.5 text-[10px] uppercase tracking-wider">
                          Stated Reason:
                        </span>
                        {r.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Tickets Section */}
          {(activeTab === "all" || activeTab === "tickets") && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Support Tickets ({data.tickets.length})
                </h2>
              </div>

              {data.tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-500 shadow-2xs">
                  No open support tickets. High priority or unresolved matters escalated by the agent will be catalogued here.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.tickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                        <div>
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            Ticket #{t.id}
                          </span>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            {t.order_id ? `Referenced Order #${t.order_id} · ` : ""}
                            Created {fmt(t.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <StatusBadge value={t.priority} />
                          <StatusBadge value={t.status} />
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 p-3 text-xs text-zinc-800 dark:text-zinc-200 border border-zinc-100/80 dark:border-zinc-700/80 leading-relaxed">
                        <span className="font-semibold text-zinc-500 block mb-0.5 text-[10px] uppercase tracking-wider">
                          Customer Issue:
                        </span>
                        {t.issue}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
