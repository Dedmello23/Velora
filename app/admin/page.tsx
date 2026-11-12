"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import { ShieldAlert, Filter, User, AlertCircle, Clock } from "lucide-react";

type AdminTicket = {
  id: number;
  customer_id: string;
  customer_name?: string;
  order_id: number | null;
  issue: string;
  priority: string;
  status: string;
  created_at: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function AdminPage() {
  const [tickets, setTickets] = useState<AdminTicket[] | null>(null);
  const [error, setError] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/tickets", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(
              "Admin tickets API is awaiting backend deployment by Member 3."
            );
          }
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Failed to load admin tickets");
        }
        const json = await res.json();
        if (alive) {
          setTickets(json.tickets ?? json);
          setError("");
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load tickets");
      }
    }

    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const filtered = tickets
    ? filterPriority === "all"
      ? tickets
      : tickets.filter((t) => t.priority === filterPriority)
    : [];

  return (
    <DashboardLayout
      title="Admin Escalation Queue"
      subtitle="Centralized dashboard for escalated customer support tickets"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            <ShieldAlert className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            Escalation Monitor ({tickets ? filtered.length : 0})
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time feed of requests requiring resolution
          </p>
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 text-zinc-400 font-medium mr-1 text-[11px]">
            <Filter className="h-3 w-3" /> Priority:
          </span>
          {["all", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`rounded-xl px-3 py-1.5 font-semibold text-xs capitalize transition-all min-h-[36px] ${
                filterPriority === p
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xs"
                  : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-300 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Backend Integration Status</span>
          </div>
          <p className="mt-1 text-amber-800 dark:text-amber-400/90 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {!tickets && !error && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-12 w-full bg-zinc-50 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {tickets && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center shadow-2xs">
          <ShieldAlert className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">No tickets found</h3>
          <p className="mt-1 text-xs text-zinc-500">
            There are currently no escalations matching priority &quot;{filterPriority}&quot;.
          </p>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-3.5">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                  #{t.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Ticket #{t.id}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      <User className="h-3 w-3 text-zinc-400" />
                      {t.customer_name ?? t.customer_id}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.order_id ? `Order #${t.order_id} · ` : ""}
                    Logged {fmt(t.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <StatusBadge value={t.priority} />
                <StatusBadge value={t.status} />
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 p-3.5 text-xs text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700/60 leading-relaxed">
              <span className="font-semibold text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider">
                Issue Description
              </span>
              {t.issue}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
