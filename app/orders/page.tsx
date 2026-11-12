"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";

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
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (alive) {
          setOrders(json.orders);
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
      {!orders && !error && <p className="text-sm text-slate-500">Loading…</p>}
      {orders?.length === 0 && <p className="text-sm text-slate-500">You have no orders yet.</p>}
      <ul className="space-y-3">
        {orders?.map((o) => (
          <li key={o.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">Order #{o.id}</span>
              <StatusBadge value={o.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Placed {o.order_date} ·{" "}
              {o.delivered_date
                ? `Delivered ${o.delivered_date}`
                : o.expected_delivery
                  ? `Expected ${o.expected_delivery}`
                  : "No delivery date"}
              {o.courier && ` · ${o.courier}`}
              {o.tracking_number && ` · ${o.tracking_number}`}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {o.items.map((i) => (
                <li key={i.product_id} className="flex justify-between gap-2">
                  <span>
                    {i.name} <span className="text-slate-400">×{i.quantity}</span>
                  </span>
                  <span className="text-slate-500">₹{i.unit_price.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right text-sm font-medium">
              Total ₹{Number(o.total_amount).toLocaleString("en-IN")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
