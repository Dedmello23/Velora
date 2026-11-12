"use client";

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // Order statuses (Solid modern high-contrast styling)
  placed: { bg: "bg-slate-700 dark:bg-slate-600", text: "text-white", border: "border-transparent", dot: "bg-white" },
  shipped: { bg: "bg-blue-600 dark:bg-blue-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  out_for_delivery: { bg: "bg-indigo-600 dark:bg-indigo-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  delivered: { bg: "bg-emerald-600 dark:bg-emerald-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  cancelled: { bg: "bg-rose-600 dark:bg-rose-500", text: "text-white", border: "border-transparent", dot: "bg-white" },

  // Return statuses
  requested: { bg: "bg-amber-500 dark:bg-amber-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  approved: { bg: "bg-blue-600 dark:bg-blue-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  picked_up: { bg: "bg-indigo-600 dark:bg-indigo-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  refunded: { bg: "bg-emerald-600 dark:bg-emerald-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  rejected: { bg: "bg-rose-600 dark:bg-rose-500", text: "text-white", border: "border-transparent", dot: "bg-white" },

  // Ticket statuses
  open: { bg: "bg-amber-500 dark:bg-amber-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  in_progress: { bg: "bg-blue-600 dark:bg-blue-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  resolved: { bg: "bg-emerald-600 dark:bg-emerald-500", text: "text-white", border: "border-transparent", dot: "bg-white" },

  // Priorities
  low: { bg: "bg-slate-600 dark:bg-slate-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  medium: { bg: "bg-amber-500 dark:bg-amber-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
  high: { bg: "bg-rose-600 dark:bg-rose-500", text: "text-white", border: "border-transparent", dot: "bg-white" },
};

export default function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replace(/ /g, "_");
  const style = BADGE_STYLES[normalized] ?? {
    bg: "bg-slate-700 dark:bg-slate-600",
    text: "text-white",
    border: "border-transparent",
    dot: "bg-white",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight shadow-xs ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span className="capitalize">{value.replace(/_/g, " ")}</span>
    </span>
  );
}
