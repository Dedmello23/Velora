"use client";

import AgentChat from "@/components/AgentChat";
import AppHeader from "@/components/AppHeader";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      <AppHeader />
      <AgentChat />
    </main>
  );
}
