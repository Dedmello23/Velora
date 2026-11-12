"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/* Shared building blocks so every page uses the same look. */

export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

const TONES = {
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-200",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  placed: "zinc",
  shipped: "blue",
  out_for_delivery: "violet",
  delivered: "emerald",
  cancelled: "rose",
  requested: "amber",
  approved: "blue",
  picked_up: "violet",
  refunded: "emerald",
  rejected: "rose",
  open: "amber",
  in_progress: "blue",
  resolved: "emerald",
  low: "zinc",
  medium: "amber",
  high: "rose",
};

export function StatusChip({ value, label }: { value: string; label?: string }) {
  const key = value.toLowerCase().replace(/ /g, "_");
  const text = label ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none ${
        TONES[STATUS_TONE[key] ?? "zinc"]
      }`}
    >
      {text}
    </span>
  );
}

export function PageHeading({
  title,
  hint,
}: {
  title: string;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
      {hint && <span className="hidden text-xs text-zinc-400 sm:inline">{hint}</span>}
    </div>
  );
}

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="-mx-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <div role="tablist" className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const on = value === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(tab.id)}
              className={`h-8 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors ${
                on
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 ${on ? "opacity-70" : "text-zinc-400"}`}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Notice({
  tone = "error",
  title,
  children,
}: {
  tone?: "error" | "warn";
  title?: string;
  children: ReactNode;
}) {
  const cls =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
  return (
    <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${cls}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p className={title ? "mt-0.5 text-[13px]" : ""}>{children}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{children}</p>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, n) => (
        <div
          key={n}
          className="animate-pulse overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="mt-4 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      aria-label="Progress"
    >
      {steps.map((label, i) => (
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
