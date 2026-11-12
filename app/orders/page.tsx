"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import { Package, Truck, Calendar, ShoppingBag, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type Item = { product_id: string; name: string; quantity: number; unit_price: number };
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

  return (
    <DashboardLayout
      title="My Orders"
      subtitle="View current shipment status, purchase breakdown, and delivery records"
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300 shadow-2xs">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {!orders && !error && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-4 w-56 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-zinc-50 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-4/5 bg-zinc-50 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {orders && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-3">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No orders placed yet</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Orders placed in ShopEase will display here automatically.
          </p>
        </div>
      )}

      {/* Orders Grid/List */}
      <div className="space-y-4">
        {orders?.map((o) => (
          <div
            key={o.id}
            className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all overflow-hidden"
          >
            {/* Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Order #{o.id}
                    </span>
                    <StatusBadge value={o.status} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-400" />
                      Placed {o.order_date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                  Total
                </span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{Number(o.total_amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Shipment / Tracking Banner */}
            <div className="px-5 py-3 bg-zinc-50/20 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>
                  {o.delivered_date ? (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Delivered on {o.delivered_date}
                    </span>
                  ) : o.expected_delivery ? (
                    <span>Expected delivery by {o.expected_delivery}</span>
                  ) : (
                    <span>Shipment in progress</span>
                  )}
                </span>
              </div>

              {o.tracking_number && (
                <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800 px-2 py-0.5 rounded-md break-all">
                  {o.courier ? `${o.courier} · ` : ""}
                  {o.tracking_number}
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Items ({o.items.length})
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {o.items.map((i) => (
                  <li
                    key={i.product_id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-500 shrink-0">
                        ×{i.quantity}
                      </div>
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {i.name}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                      ₹{(i.unit_price * i.quantity).toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card Action Footer */}
            <div className="flex items-center justify-end border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30 px-5 py-2.5">
              <Link
                href={`/?q=Where+is+my+order+${o.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <span>Ask AI Agent about this order</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
