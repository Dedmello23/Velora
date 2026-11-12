"use client";

import AgentChat from "@/components/AgentChat";
import DashboardLayout from "@/components/DashboardLayout";

export default function HomePage() {
  return (
    <DashboardLayout
      title="Support Agent"
      subtitle="AI-driven conversational assistant for order tracking, returns, and support escalation"
    >
      <AgentChat />
    </DashboardLayout>
  );
}
