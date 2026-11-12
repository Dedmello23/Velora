import type { ReactNode } from "react";

// Only the details a customer needs to spot quickly: order/ticket/return numbers, tracking numbers, dates, amounts.
const IMPORTANT =
  /((?:order|ticket|return)\s#?\d+|#\d+|\bTRK\w+|\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|\b\d{4}-\d{2}-\d{2}\b|₹[\d,]+(?:\.\d+)?)/gi;

/** Shows the agent's plain-text reply and makes only the important details bold. */
export default function ReplyText({ text }: { text: string }) {
  const parts: ReactNode[] = text.split(IMPORTANT).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="font-semibold text-zinc-900 dark:text-white">
        {part}
      </span>
    ) : (
      part
    )
  );
  return <>{parts}</>;
}
