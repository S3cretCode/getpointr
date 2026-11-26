import type { Metadata } from "next";
import { MonetizationContent } from "@/components/MonetizationModal";

export const metadata: Metadata = {
  title: "Monetization Blueprint",
  description: "B2B White-Label SDK, Helpdesk SaaS, Usage API, and Trusted Circle Family Plus unit economics.",
};

export default function MonetizationPage() {
  return (
    <div className="min-h-dvh bg-gp-bg px-4 py-8 text-gp-text sm:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gp-border bg-gp-surface p-5 shadow-xl sm:p-8">
        <MonetizationContent standalone />
      </div>
    </div>
  );
}
