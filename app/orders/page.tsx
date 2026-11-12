"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Copy,
  Check,
  X,
  Package,
  Truck,
  PackageCheck,
  RotateCcw,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

type Item = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  return_window_days?: number;
};

type Order = {
  id: number;
  order_date: string;
  status: string;
  expected_delivery: string | null;
  delivered_date: string | null;
  total_amount: number;
  courier: string | null;
  tracking_number: string | null;
  items: Item[];
};


const STAGES = ["Placed", "Shipped", "Out for delivery", "Delivered"] as const;
const STAGE_INDEX: Record<string, number> = {
  placed: 0,
  shipped: 1,
  out_for_delivery: 2,
  delivered: 3,
};

const CHIP: Record<string, string> = {
  placed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-200",
  shipped: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  out_for_delivery: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const TILE_TONES = [
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
];

function parseDay(d: string) {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const date = parseDay(d);
  const sameYear = date.getUTCFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

function returnNote(deliveredDate: string | null, windowDays?: number) {
  if (!deliveredDate || windowDays === undefined) return null;
  if (windowDays <= 0) return { text: "Not returnable", tone: "muted" as const };
  const until = parseDay(deliveredDate);
  until.setUTCDate(until.getUTCDate() + windowDays);
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const label = until.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return until.getTime() >= todayUtc
    ? { text: `Return eligible until ${label}`, tone: "ok" as const }
    : { text: `Return window closed ${label}`, tone: "muted" as const };
}

/** Deep link into the support agent with a pre-written question. */
const agentLink = (q: string) => `/?q=${encodeURIComponent(q)}`;

function helpPrompt(o: { id: number; status: string }, isLate: boolean) {
  if (o.status === "cancelled") return `Order ${o.id} was cancelled. When will I get my refund?`;
  if (isLate) return `My order ${o.id} is late. Can you help?`;
  return `I need help with order ${o.id}.`;
}

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      aria-label="Copy tracking number"
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function Stepper({ status }: { status: string }) {
  const current = STAGE_INDEX[status] ?? 0;
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Delivery progress">
      {STAGES.map((label, i) => (
        <li key={label}>
          <span
            className={`block h-1 rounded-full ${
              i <= current ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
          <span
            className={`mt-1.5 block truncate text-[11px] leading-none ${
              i === current
                ? "font-semibold text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load orders");
        if (alive) {
          setOrders(json.orders);
          setError("");
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load orders");
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Compute Shadboard Analytics Metrics
  const stats = useMemo(() => {
    if (!orders) return null;
    const totalSpent = orders.reduce(
      (acc, o) => acc + (o.status !== "cancelled" ? Number(o.total_amount) : 0),
      0
    );
    const active = orders.filter(
      (o) =>
        o.status === "placed" ||
        o.status === "shipped" ||
        o.status === "out_for_delivery"
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;

    return { total: orders.length, totalSpent, active, delivered, cancelled };
  }, [orders]);

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      // Status filter
      if (filterStatus === "active") {
        if (
          o.status !== "placed" &&
          o.status !== "shipped" &&
          o.status !== "out_for_delivery"
        )
          return false;
      } else if (filterStatus === "delivered") {
        if (o.status !== "delivered") return false;
      } else if (filterStatus === "cancelled") {
        if (o.status !== "cancelled") return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchId = String(o.id).includes(q);
      const matchTracking = o.tracking_number?.toLowerCase().includes(q) ?? false;
      const matchCourier = o.courier?.toLowerCase().includes(q) ?? false;
      const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q));

      return matchId || matchTracking || matchCourier || matchItems;
    });
  }, [orders, filterStatus, searchQuery]);

  const FILTERS = [
    { id: "all", label: "All", count: stats?.total },
    { id: "active", label: "In transit", count: stats?.active },
    { id: "delivered", label: "Delivered", count: stats?.delivered },
    { id: "cancelled", label: "Cancelled", count: stats?.cancelled },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          Your orders
        </h1>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Toolbar: stacked on mobile, single row on desktop */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row-reverse lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, product or tracking ID"
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-10 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="-mx-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          <div role="tablist" className="flex min-w-max gap-2">
            {FILTERS.map((tab) => {
              const on = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`h-8 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors ${
                    on
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 text-xs ${on ? "opacity-70" : "text-zinc-400"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        </div>

        {/* Loading skeleton */}
        {!orders && !error && (
          <div className="mt-5 space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800/60" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex gap-3">
                    <div className="h-16 w-16 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {orders && filteredOrders.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No orders found
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {searchQuery
                ? `Nothing matches "${searchQuery}". Try a different keyword.`
                : "There are no orders in this view yet."}
            </p>
          </div>
        )}

        {/* Order cards */}
        <div className="mt-4 space-y-3">
          {filteredOrders.map((o) => {
            const isExpanded = expandedId === o.id;
            const inFlight = o.status in STAGE_INDEX && o.status !== "delivered";
            const now = new Date();
            const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
            const isLate =
              inFlight &&
              !!o.expected_delivery &&
              parseDay(o.expected_delivery).getTime() < todayUtc;
            const visibleItems = isExpanded ? o.items : o.items.slice(0, 2);
            const hiddenCount = o.items.length - 2;
            const primary =
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200";

            return (
              <article
                key={o.id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Header: identity + status */}
                <header className="flex items-start justify-between gap-3 px-4 pt-3.5 sm:px-5">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Order #{o.id}
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-500">Placed {fmtDate(o.order_date)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${
                      CHIP[o.status] ?? CHIP.placed
                    }`}
                  >
                    {statusLabel(o.status)}
                  </span>
                </header>

                {/* Delivery info */}
                <div className="mt-3 space-y-2.5 px-4 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    {o.status === "delivered" ? (
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Delivered {fmtDate(o.delivered_date)}
                      </p>
                    ) : o.status === "cancelled" ? (
                      <p className="flex items-center gap-1.5 text-[13px] text-zinc-500">
                        <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        This order was cancelled
                      </p>
                    ) : (
                      <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                        {o.expected_delivery ? `Arriving ${fmtDate(o.expected_delivery)}` : "Preparing your order"}
                        {isLate && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            Delayed
                          </span>
                        )}
                      </p>
                    )}

                    {o.tracking_number && (
                      <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {o.courier && <span>{o.courier}</span>}
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">{o.tracking_number}</span>
                        <CopyButton value={o.tracking_number} />
                      </p>
                    )}
                  </div>

                  {inFlight && <Stepper status={o.status} />}
                </div>

                {/* Items */}
                <ul className="mx-4 mt-3 divide-y sm:mx-5 divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
                  {visibleItems.map((i, n) => {
                    const note = o.status === "delivered" ? returnNote(o.delivered_date, i.return_window_days) : null;
                    return (
                      <li key={i.product_id} className="flex items-center gap-3 py-2.5">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                            TILE_TONES[(o.id + n) % TILE_TONES.length]
                          }`}
                          aria-hidden
                        >
                          {i.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                            {i.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            Qty {i.quantity}
                            {note && (
                              <>
                                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                                <span className={note.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : ""}>
                                  {note.text}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <p className="text-[13px] font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                            ₹{(i.unit_price * i.quantity).toLocaleString("en-IN")}
                          </p>
                          {note?.tone === "ok" && o.items.length > 1 && (
                            <Link
                              href={agentLink(`I want to return the ${i.name} from order ${o.id}.`)}
                              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-white"
                            >
                              Return
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <li className="py-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : o.id)}
                        className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      >
                        {isExpanded ? "Show less" : `+${hiddenCount} more item${hiddenCount > 1 ? "s" : ""}`}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </li>
                  )}
                </ul>

                {/* Footer: total + actions */}
                <footer className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/30 sm:px-5">
                  <div className="leading-tight">
                    <p className="text-[11px] text-zinc-500">Total</p>
                    <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                      ₹{Number(o.total_amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={agentLink(helpPrompt(o, isLate))}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800"
                      aria-label="Get help"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Help</span>
                    </Link>
                    {o.status === "delivered" ? (
                      <Link
                        href={agentLink(
                          o.items.length === 1
                            ? `I want to return the ${o.items[0].name} from order ${o.id}.`
                            : `I want to return an item from order ${o.id}.`
                        )}
                        className={primary}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Return
                      </Link>
                    ) : o.status !== "cancelled" ? (
                      <Link href={agentLink(`Where is my order ${o.id}?`)} className={primary}>
                        <PackageCheck className="h-4 w-4" />
                        Track order
                      </Link>
                    ) : null}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
