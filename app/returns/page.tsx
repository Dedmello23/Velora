"use client";

import { useEffect, useState } from "react";
import {
  CardSkeleton,
  EmptyState,
  FilterTabs,
  Notice,
  PageHeading,
  ProgressSteps,
  StatusChip,
  fmtDateTime,
} from "@/components/ui";
import { RotateCcw, LifeBuoy, XCircle } from "lucide-react";

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

type Tab = "all" | "returns" | "tickets";

const RETURN_STEPS = ["Requested", "Approved", "Picked up", "Refunded"];
const RETURN_INDEX: Record<string, number> = { requested: 0, approved: 1, picked_up: 2, refunded: 3 };

const TILE_TONES = [
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
];

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-zinc-400">
      {icon}
      {children}
    </h2>
  );
}

export default function ReturnsPage() {
  const [data, setData] = useState<{ returns: Return[]; tickets: Ticket[] } | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");

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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: data ? data.returns.length + data.tickets.length : undefined },
    { id: "returns", label: "Returns", count: data?.returns.length },
    { id: "tickets", label: "Tickets", count: data?.tickets.length },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-5xl">
        <PageHeading title="Returns & tickets" hint="Updates automatically" />

        {error && <Notice>{error}</Notice>}

        <div className="mt-4">
          <FilterTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        </div>

        {!data && !error && (
          <div className="mt-4">
            <CardSkeleton count={2} />
          </div>
        )}

        {data && (
          <div className="mt-5 space-y-7">
            {(activeTab === "all" || activeTab === "returns") && (
              <section>
                <SectionTitle icon={<RotateCcw />}>Returns</SectionTitle>
                {data.returns.length === 0 ? (
                  <EmptyState icon={<RotateCcw />} title="No returns yet">
                    Ask the support agent to start a return for any eligible delivered item.
                  </EmptyState>
                ) : (
                  <div className="space-y-3">
                    {data.returns.map((r) => {
                      const rejected = r.status === "rejected";
                      return (
                        <article
                          key={r.id}
                          className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <header className="flex items-center gap-3 px-4 pt-3.5 sm:px-5">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                                TILE_TONES[r.id % TILE_TONES.length]
                              }`}
                              aria-hidden
                            >
                              {r.product_name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                                {r.product_name}
                              </h3>
                              <p className="mt-0.5 text-xs text-zinc-500">
                                Return #{r.id} · Order #{r.order_id}
                              </p>
                            </div>
                            <StatusChip value={r.status} />
                          </header>

                          <div className="mt-3 px-4 sm:px-5">
                            {rejected ? (
                              <p className="flex items-center gap-1.5 text-[13px] text-zinc-500">
                                <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                                This return request was not approved
                              </p>
                            ) : (
                              <ProgressSteps steps={RETURN_STEPS} current={RETURN_INDEX[r.status] ?? 0} />
                            )}
                          </div>

                          <div className="mx-4 mt-3 border-t border-zinc-100 py-3 dark:border-zinc-800 sm:mx-5">
                            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Reason</p>
                            <p className="mt-1 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                              {r.reason}
                            </p>
                          </div>

                          <footer className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/30 sm:px-5">
                            Requested {fmtDateTime(r.created_at)}
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {(activeTab === "all" || activeTab === "tickets") && (
              <section>
                <SectionTitle icon={<LifeBuoy />}>Support tickets</SectionTitle>
                {data.tickets.length === 0 ? (
                  <EmptyState icon={<LifeBuoy />} title="No support tickets">
                    Issues the agent escalates to our team will show up here.
                  </EmptyState>
                ) : (
                  <div className="space-y-3">
                    {data.tickets.map((t) => (
                      <article
                        key={t.id}
                        className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <header className="flex items-start justify-between gap-3 px-4 pt-3.5 sm:px-5">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                              Ticket #{t.id}
                            </h3>
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

                        <footer className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/30 sm:px-5">
                          Opened {fmtDateTime(t.created_at)}
                        </footer>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
