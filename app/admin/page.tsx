"use client";

import { useEffect, useState } from "react";
import {
  CardSkeleton,
  EmptyState,
  FilterTabs,
  Notice,
  PageHeading,
  StatusChip,
  fmtDateTime,
} from "@/components/ui";
import { ShieldAlert, User } from "lucide-react";

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

type Priority = "all" | "high" | "medium" | "low";

export default function AdminPage() {
  const [tickets, setTickets] = useState<AdminTicket[] | null>(null);
  const [error, setError] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority>("all");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/tickets", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Admin tickets API is awaiting backend deployment by Member 3.");
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

  const count = (p: string) => tickets?.filter((t) => t.priority === p).length;
  const filtered = tickets
    ? filterPriority === "all"
      ? tickets
      : tickets.filter((t) => t.priority === filterPriority)
    : [];

  const stats = tickets && [
    { label: "Total", value: tickets.length },
    { label: "Open", value: tickets.filter((t) => t.status === "open").length },
    { label: "In progress", value: tickets.filter((t) => t.status === "in_progress").length },
    { label: "High priority", value: tickets.filter((t) => t.priority === "high").length },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-5xl">
        <PageHeading title="Escalation queue" hint="Updates automatically" />

        {error && (
          <Notice tone="warn" title="Backend status">
            {error}
          </Notice>
        )}

        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs text-zinc-500">{s.label}</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-white">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <FilterTabs
            value={filterPriority}
            onChange={setFilterPriority}
            tabs={[
              { id: "all", label: "All", count: tickets?.length },
              { id: "high", label: "High", count: count("high") },
              { id: "medium", label: "Medium", count: count("medium") },
              { id: "low", label: "Low", count: count("low") },
            ]}
          />
        </div>

        {!tickets && !error && (
          <div className="mt-4">
            <CardSkeleton count={3} />
          </div>
        )}

        {tickets && filtered.length === 0 && (
          <div className="mt-4">
            <EmptyState icon={<ShieldAlert />} title="Queue is clear">
              {filterPriority === "all"
                ? "There are no escalated tickets right now."
                : `There are no ${filterPriority} priority tickets right now.`}
            </EmptyState>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {filtered.map((t) => (
            <article
              key={t.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header className="flex items-start justify-between gap-3 px-4 pt-3.5 sm:px-5">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Ticket #{t.id}
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {t.order_id ? `Order #${t.order_id}` : "General query"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <StatusChip value={t.priority} label={`${t.priority[0].toUpperCase()}${t.priority.slice(1)} priority`} />
                  <StatusChip value={t.status} />
                </div>
              </header>

              <p className="mx-4 mt-3 border-t border-zinc-100 py-3 text-[13px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 sm:mx-5">
                {t.issue}
              </p>

              <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/30 sm:px-5">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {t.customer_name ?? t.customer_id}
                  </span>
                </span>
                <span>Opened {fmtDateTime(t.created_at)}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
