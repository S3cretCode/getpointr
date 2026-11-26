"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  HeartHandshake,
  Layers,
  PlugZap,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { AppearanceBar } from "@/lib/preferences";

export const MONETIZATION_PILLARS = [
  {
    id: "sdk",
    tag: "Primary Revenue Engine · B2B",
    title: "White-Label Regulated Support SDK",
    price: "$1,500 - $5,000 / mo",
    unit: "or $0.05 per Monthly Active User",
    margin: "88% gross margin",
    icon: Building2,
    accent: "text-laser bg-laser/15",
    barPct: 52,
    customers: "Credit unions, regional banks, wealth portals, telehealth, and Medicare apps.",
    summary: "Drop-in mobile & web SDK for banks and healthcare apps to guide members visually with zero remote-takeover liability.",
    points: [
      "Eliminates multi-million-dollar social engineering & AnyDesk fraud exposure.",
      "Cuts $12-$25 average call-center support ticket cost by ~42% via faster visual resolution.",
      "Includes tamper-evident metadata logs for SOC2, GLBA, and HIPAA audits.",
    ],
  },
  {
    id: "seats",
    title: "Helpdesk Seat Licensing",
    tag: "Recurring SaaS · B2B",
    price: "$49 / agent / mo",
    unit: "billed annually per support seat",
    margin: "84% gross margin",
    icon: HeartHandshake,
    accent: "text-volt bg-volt/15",
    barPct: 24,
    customers: "Senior living communities, community telecoms/ISPs, municipal digital-literacy desks, and credit union reps.",
    summary: "Browser-based Helper Console seats for organizations supporting older adults and non-technical customers.",
    points: [
      "Zero install for customers: start sessions in 3 seconds via SMS link or QR scan.",
      "Mandatory Privacy Shield guarantees agents never view member balances or passwords.",
      "One-click Local AI triage offloads routine 'where do I tap?' tickets automatically.",
    ],
  },
  {
    id: "api",
    title: "Usage-Based Support Platform API",
    tag: "Channel Partnerships · B2B2C",
    price: "$0.20 / session",
    unit: "marketplace add-on & API metering",
    margin: "80% gross margin",
    icon: PlugZap,
    accent: "text-emerald-500 bg-emerald-500/15",
    barPct: 14,
    customers: "Zendesk, Intercom, Twilio Flex, Genesys, and Salesforce Service Cloud ecosystems.",
    summary: "Metered 'Launch Pointr Session' button embedded right inside existing enterprise ticketing tools.",
    points: [
      "Zero workflow switching for support teams already inside Zendesk or Intercom.",
      "Pay-as-you-go session metering scales cleanly from 500 to 500,000 monthly sessions.",
      "Built-in 20-30% app-marketplace revenue share drives low-CAC distribution.",
    ],
  },
  {
    id: "family",
    title: "Trusted Circle Family Plus",
    tag: "Viral Growth Loop · B2C Freemium",
    price: "$4.99 / mo",
    unit: "or $39 / year (1-on-1 free forever)",
    margin: "90% gross margin",
    icon: Users,
    accent: "text-sky-500 bg-sky-500/15",
    barPct: 10,
    customers: "Adult children supporting aging parents and grandparents across households.",
    summary: "Free 1-on-1 family pairing fuels organic word-of-mouth; Family Plus unlocks multi-helper circles & saved guides.",
    points: [
      "Free tier: 1 paired trusted helper with unlimited visual & Local AI sessions.",
      "Family Plus: up to 6 trusted family devices, saved replayable walkthroughs, and scam-call alerts.",
      "Every consumer user introduces GetPointr to their workplace, credit union, or care provider.",
    ],
  },
];

export function MonetizationContent({ onClose, standalone = false }: { onClose?: () => void; standalone?: boolean }) {
  const [monthlyCalls, setMonthlyCalls] = useState(12000);
  const [costPerCall, setCostPerCall] = useState(18);

  // Interactive ROI model for a mid-sized credit union / care network
  const timeSavedPct = 0.42;
  const grossMonthlySavings = Math.round(monthlyCalls * costPerCall * timeSavedPct);
  const sdkMonthlyCost = monthlyCalls <= 10000 ? 2500 : monthlyCalls <= 30000 ? 4000 : 6500;
  const netAnnualRoi = (grossMonthlySavings - sdkMonthlyCost) * 12;
  const paybackDays = Math.max(2, Math.round((sdkMonthlyCost / grossMonthlySavings) * 30));

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gp-border pb-5">
        <div className="flex items-center gap-3">
          {standalone ? (
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gp-border bg-gp-card px-3.5 text-[0.88rem] font-bold text-gp-text transition-colors hover:bg-gp-hover"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          ) : (
            <Logo size={28} />
          )}
          <span className="rounded-full bg-laser/15 px-3 py-1 text-[12px] font-bold text-laser">
            Business Model &amp; Unit Economics
          </span>
        </div>
        <div className="flex items-center gap-2">
          {standalone && <AppearanceBar />}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close monetization blueprint"
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-gp-border bg-gp-card px-3.5 text-[0.88rem] font-bold text-gp-text transition-colors hover:bg-gp-hover"
            >
              <X className="h-4 w-4" /> Close
            </button>
          )}
        </div>
      </div>

      {/* Hero summary */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-gp-text sm:text-[2.5rem]">
            B2B Enterprise Protection Powered by Viral Family Trust
          </h1>
          <p className="mt-3 text-[1rem] font-medium leading-relaxed text-gp-sub">
            GetPointr monetizes where remote-access scams and support calls hurt the bottom line most: credit unions,
            healthcare portals, and senior support desks, while a free 1-on-1 family tier drives zero-CAC consumer
            adoption.
          </p>
        </div>

        {/* Projected Revenue Mix Visual */}
        <div className="rounded-2xl border border-gp-border bg-gp-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-gp-muted">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-laser" /> Target ARR Revenue Mix
            </span>
            <span className="text-emerald-500">~86% Blended Margin</span>
          </div>
          <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-gp-elevated p-0.5">
            <div style={{ width: "52%" }} className="h-full rounded-l-full bg-laser" title="White-Label SDK (52%)" />
            <div style={{ width: "24%" }} className="h-full bg-volt" title="Helpdesk Seats (24%)" />
            <div style={{ width: "14%" }} className="h-full bg-emerald-500" title="Usage API (14%)" />
            <div style={{ width: "10%" }} className="h-full rounded-r-full bg-sky-500" title="Family Plus (10%)" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-semibold">
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-laser" /> 52% Banking &amp; Health SDK
            </span>
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-volt" /> 24% Helpdesk Seats
            </span>
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 14% Usage API
            </span>
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> 10% Family Plus
            </span>
          </div>
        </div>
      </div>

      {/* 4 Detailed Revenue Pillars */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {MONETIZATION_PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border border-gp-border bg-gp-card p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${p.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="text-right">
                  <div className="text-[1.2rem] font-extrabold text-gp-text">{p.price}</div>
                  <div className="text-[11px] font-semibold text-gp-muted">{p.unit}</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-laser">{p.tag}</div>
              <h2 className="mt-0.5 text-[1.18rem] font-extrabold text-gp-text">{p.title}</h2>
              <p className="mt-1.5 text-[0.9rem] font-medium leading-relaxed text-gp-sub">{p.summary}</p>
              <div className="mt-3 rounded-xl bg-gp-elevated px-3 py-2 text-[12px] font-semibold text-gp-sub">
                <span className="font-bold text-gp-text">Buyers: </span>
                {p.customers}
              </div>
              <ul className="mt-3 space-y-1.5 text-[0.86rem] font-medium text-gp-sub">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-gp-muted">
                  <span>Share of projected ARR: {p.barPct}%</span>
                  <span className="text-emerald-500">{p.margin}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Enterprise ROI Calculator + Go-To-Market Flywheel */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-gp-border bg-gp-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-laser">
            <Calculator className="h-4 w-4" /> Interactive Credit Union ROI Estimator
          </div>
          <h3 className="mt-1 text-[1.2rem] font-extrabold text-gp-text">
            Why Enterprise Buyers Say Yes Immediately
          </h3>
          <p className="mt-1 text-[0.88rem] font-medium text-gp-sub">
            Adjust monthly app-support call volume and average ticket cost to see net annual savings from a 42% faster
            visual resolution rate (before even counting prevented scam losses).
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-[0.86rem] font-bold">
                <label htmlFor="calls-slider" className="text-gp-sub">
                  Monthly Assisted Support Calls
                </label>
                <span className="font-mono text-gp-text">{monthlyCalls.toLocaleString()} calls / mo</span>
              </div>
              <input
                id="calls-slider"
                type="range"
                min={2000}
                max={50000}
                step={1000}
                value={monthlyCalls}
                onChange={(e) => setMonthlyCalls(Number(e.target.value))}
                className="mt-1.5 w-full cursor-pointer accent-laser"
              />
            </div>

            <div>
              <div className="flex justify-between text-[0.86rem] font-bold">
                <label htmlFor="cost-slider" className="text-gp-sub">
                  Avg. Call-Center Cost per Ticket
                </label>
                <span className="font-mono text-gp-text">${costPerCall} / call</span>
              </div>
              <input
                id="cost-slider"
                type="range"
                min={10}
                max={30}
                step={1}
                value={costPerCall}
                onChange={(e) => setCostPerCall(Number(e.target.value))}
                className="mt-1.5 w-full cursor-pointer accent-laser"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-gp-elevated p-3.5 text-center">
            <div>
              <div className="text-[11px] font-bold uppercase text-gp-muted">SDK License</div>
              <div className="mt-0.5 font-mono text-[1.1rem] font-extrabold text-gp-text">
                ${sdkMonthlyCost.toLocaleString()}/mo
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-gp-muted">Payback Period</div>
              <div className="mt-0.5 font-mono text-[1.1rem] font-extrabold text-laser">{paybackDays} days</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-gp-muted">Net Annual ROI</div>
              <div className="mt-0.5 font-mono text-[1.1rem] font-extrabold text-emerald-500">
                +${netAnnualRoi.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Go-To-Market Flywheel Visual */}
        <div className="flex flex-col justify-between rounded-2xl border border-gp-border bg-gp-card p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-volt">
              <TrendingUp className="h-4 w-4" /> Go-To-Market Flywheel
            </div>
            <h3 className="mt-1 text-[1.2rem] font-extrabold text-gp-text">Zero-CAC Bottom-Up Expansion</h3>
            <ol className="mt-4 space-y-3 text-[0.88rem]">
              {[
                {
                  step: "1",
                  title: "Free Family Pairing",
                  desc: "Adult children pair their laptop with Mom's phone in person to help safely.",
                },
                {
                  step: "2",
                  title: "Local AI Reduces Friction",
                  desc: "Parents solve everyday questions solo via the 100% on-device Local AI guide.",
                },
                {
                  step: "3",
                  title: "Senior Living & Telecom Seats",
                  desc: "Care desks adopt $49/mo Helper Console seats after seeing families use it.",
                },
                {
                  step: "4",
                  title: "Enterprise Banking SDK",
                  desc: "Credit unions embed the White-Label SDK to eliminate AnyDesk fraud & cut call times.",
                },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3 rounded-xl bg-gp-elevated p-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-laser text-[12px] font-extrabold text-white">
                    {item.step}
                  </span>
                  <div>
                    <div className="font-bold text-gp-text">{item.title}</div>
                    <div className="text-[12px] font-medium text-gp-sub">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Zero media relay servers = ultra-low infra cost
            </span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MonetizationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GetPointr Monetization Blueprint"
      className="fixed inset-0 z-50 overflow-y-auto bg-gp-bg/95 p-4 backdrop-blur-md sm:p-8"
    >
      <div className="gp-rise rounded-3xl border border-gp-border bg-gp-surface p-5 shadow-2xl sm:p-8">
        <MonetizationContent onClose={onClose} />
      </div>
    </div>
  );
}
