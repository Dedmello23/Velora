"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import {
  Package,
  Truck,
  Calendar,
  ShoppingBag,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  CreditCard,
  XCircle,
  ChevronDown,
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

  return (
    <DashboardLayout
      title="Orders Analytics"
      subtitle="Real-time shipment telemetry, item breakdowns, and purchase tracking"
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300 shadow-2xs">
          ⚠️ {error}
        </div>
      )}

      {/* 1. Shadboard Analytics Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total Spend */}
          <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Total Spend
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                ₹{stats.totalSpent.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>Verified customer transactions</span>
            </p>
          </div>

          {/* Active Shipments */}
          <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                In Transit
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {stats.active}
              </span>
              <span className="text-xs text-zinc-400">active</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              <Clock className="h-3 w-3" />
              <span>Live tracking telemetry</span>
            </p>
          </div>

          {/* Delivered */}
          <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Delivered
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {stats.delivered}
              </span>
              <span className="text-xs text-zinc-400">orders</span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              Eligible for return policy check
            </p>
          </div>

          {/* Total Orders */}
          <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {stats.total}
              </span>
              <span className="text-xs text-zinc-400">all time</span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              Customer ID: C001
            </p>
          </div>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "All Orders", count: stats?.total },
            { id: "active", label: "In Transit", count: stats?.active },
            { id: "delivered", label: "Delivered", count: stats?.delivered },
            { id: "cancelled", label: "Cancelled", count: stats?.cancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
                filterStatus === tab.id
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xs"
                  : "bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, item, tracking..."
            className="w-full rounded-xl border border-zinc-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3.5 py-1.5 pl-9 text-xs text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all min-h-[36px]"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {!orders && !error && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
              <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-800 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {orders && filteredOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center shadow-2xs animate-in fade-in-50 duration-200">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-2">
            <XCircle className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
            No matching orders found
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchQuery
              ? `No records found for "${searchQuery}". Try a different keyword.`
              : "No orders match the selected filter."}
          </p>
        </div>
      )}

      {/* 3. Modern Shadboard Orders List with Smooth Animation */}
      <div className="space-y-3">
        {filteredOrders.map((o, idx) => {
          const isExpanded = expandedId === o.id;
          const isLate =
            (o.status === "shipped" || o.status === "placed" || o.status === "out_for_delivery") &&
            o.expected_delivery &&
            new Date(o.expected_delivery) < new Date();

          return (
            <div
              key={o.id}
              style={{ animationDelay: `${idx * 40}ms` }}
              className="group rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-2"
            >
              {/* Card Header Row */}
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-2xs group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-colors">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
                          Order #{o.id}
                        </span>
                        <StatusBadge value={o.status} />
                        {isLate && (
                          <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                            LATE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Placed {o.order_date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Expand button */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                        Amount
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                        ₹{Number(o.total_amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      className="rounded-xl p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title={isExpanded ? "Collapse" : "Expand items"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Delivery & Tracking Telemetry Bar */}
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-2.5 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>
                      {o.delivered_date ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Delivered on {o.delivered_date}
                        </span>
                      ) : o.expected_delivery ? (
                        <span>
                          Expected delivery:{" "}
                          <strong className="text-zinc-900 dark:text-white">
                            {o.expected_delivery}
                          </strong>
                        </span>
                      ) : (
                        <span>Order processed</span>
                      )}
                    </span>
                  </div>

                  {o.tracking_number && (
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                      {o.courier ? <span className="font-sans font-semibold mr-1">{o.courier}:</span> : ""}
                      <span className="break-all">{o.tracking_number}</span>
                    </div>
                  )}
                </div>

                {/* Quick Items Preview (Collapsible) */}
                <div className={`mt-3 space-y-1.5 ${isExpanded ? "block" : "hidden sm:block"}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex justify-between">
                    <span>Products ({o.items.length})</span>
                    <span className="hidden sm:inline">Price</span>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {o.items.map((i) => (
                      <div
                        key={i.product_id}
                        className="flex items-center justify-between py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="h-5 min-w-[20px] rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                            {i.quantity}
                          </span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                            {i.name}
                          </span>
                          {i.return_window_days !== undefined && (
                            <span className="hidden md:inline text-[10px] text-zinc-400">
                              ({i.return_window_days}d window)
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                          ₹{(i.unit_price * i.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 px-4 py-2.5 text-xs">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-orange-500 fill-orange-500" />
                  Instant Groq actions supported
                </span>

                <Link
                  href={`/?q=Where+is+my+order+${o.id}`}
                  className="inline-flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors group/link"
                >
                  <span>Query with Agent</span>
                  <ArrowUpRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
