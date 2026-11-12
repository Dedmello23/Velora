import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velora · ShopEase Support",
  description: "E-commerce customer support agent: order tracking, returns and escalation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
