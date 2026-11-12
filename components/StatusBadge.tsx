const COLORS: Record<string, string> = {
  placed: "bg-slate-100 text-slate-700",
  shipped: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  requested: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  refunded: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[value] ?? "bg-slate-100 text-slate-700"}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
