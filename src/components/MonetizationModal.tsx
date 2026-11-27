"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calculator,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Megaphone,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { AppearanceBar } from "@/lib/preferences";

export const MONETIZATION_PILLARS = [
  {
    id: "business",
    tag: "Primary B2B Engine · Setup + Recurring",
    title: "Business Systems & Customer Service",
    price: "$2,000 setup + $499/mo",
    unit: "Starter (5 seats) · Pro $1,299/mo (20 seats)",
    shareLabel: "72% of Yr-1 Rev",
    barPct: 72,
    icon: Building2,
    accent: "text-gp-accent bg-laser/15",
    customers: "Businesses, credit unions, healthcare portals, and service websites replacing support calls or generic AI.",
    summary:
      "Done-for-you visual help system built for a company's app or website, complete with offline non-AI default help and customer insights.",
    points: [
      "Full white-glove setup ($2,000 one-time) configuring helper manager accounts and custom workflows.",
      "Includes automated, offline-available non-AI default help inside Ask Help so common issues resolve immediately.",
      "Dedicated Business Insights Portal reporting most-asked questions, stuck screens, and client demographics.",
    ],
  },
  {
    id: "families",
    tag: "Consumer Subscription · Moderate Use",
    title: "Families Membership",
    price: "$6.99 / mo",
    unit: "or $59 / year (up to 5 family members)",
    shareLabel: "15% of Yr-1 Rev",
    barPct: 15,
    icon: Users,
    accent: "text-gp-sage bg-volt/15",
    customers: "Everyday families helping an elderly parent, grandparent, or child with regular tech tasks.",
    summary:
      "Simple monthly membership linking up to 5 family members in a pre-paired Trusted Circle with Mandatory Privacy Shield.",
    points: [
      "Covers moderate everyday family support without per-minute stress.",
      "Pre-paired Trusted Circle blocks cold-call scammers while keeping balances and 2FA codes blurred.",
      "Ad-free onboarding experience plus saved step-by-step replayable guides.",
    ],
  },
  {
    id: "ads",
    tag: "Partner Sponsorships · Free Tier",
    title: "Onboarding App Advertising",
    price: "$350 / mo",
    unit: "per local sponsor slot (or $15 CPM)",
    shareLabel: "9% of Yr-1 Rev",
    barPct: 9,
    icon: Megaphone,
    accent: "text-gp-sub bg-gp-elevated",
    customers: "Local credit unions, senior living communities, regional telecoms, and neighborhood pharmacies.",
    summary:
      "Tasteful partner logos and short sponsor placements inside the onboarding app for free and one-off users.",
    points: [
      "Reaches high-trust local families and seniors right inside their zip code.",
      "Never shown inside paid Business Systems or paid Families Membership accounts.",
      "Natural upsell path turning local ad sponsors into full $499/mo Business System clients.",
    ],
  },
  {
    id: "session",
    tag: "Pay-As-You-Go · One-Time Help",
    title: "Per-Session Use",
    price: "$2.99 / session",
    unit: "up to 30 min (+$1.50 per extra 15 min)",
    shareLabel: "4% of Yr-1 Rev",
    barPct: 4,
    icon: Clock,
    accent: "text-gp-accent bg-laser/15",
    customers: "Occasional users who only need help once at a time without a monthly plan.",
    summary:
      "Both sides create a quick account on the onboarding app and pay for a single session or time block on demand.",
    points: [
      "Zero monthly commitment: pay only when a tricky task comes up.",
      "Fraction of the cost of an in-person $25-$50 tech visit.",
      "Seamless one-tap upgrade to the $6.99/mo Families plan after 2+ sessions.",
    ],
  },
];

export function MonetizationContent({ onClose, standalone = false }: { onClose?: () => void; standalone?: boolean }) {
  const [replacedCalls, setReplacedCalls] = useState(300);
  const [costPerCall, setCostPerCall] = useState(16);

  // Simple, transparent B2B monthly savings math
  const planCost = replacedCalls <= 400 ? 499 : 1299;
  const planName = replacedCalls <= 400 ? "Starter ($499/mo)" : "Pro ($1,299/mo)";
  const grossSaved = replacedCalls * costPerCall;
  const netMonthlySavings = grossSaved - planCost;

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
          <span className="rounded-full bg-laser/15 px-3 py-1 text-[12px] font-bold text-gp-accent">
            Pricing, Costs &amp; Year-1 Plan
          </span>
        </div>
        <div className="flex items-center gap-2">
          {standalone && <AppearanceBar />}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close monetization plan"
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-gp-border bg-gp-card px-3.5 text-[0.88rem] font-bold text-gp-text transition-colors hover:bg-gp-hover"
            >
              <X className="h-4 w-4" /> Close
            </button>
          )}
        </div>
      </div>

      {/* Plain-English Overview + Revenue Mix Bar */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <h1 className="text-[1.95rem] font-extrabold leading-tight tracking-tight text-gp-text sm:text-[2.35rem]">
            Simple Pricing Built for Families, One-Time Users &amp; Businesses
          </h1>
          <p className="mt-3 text-[0.98rem] font-medium leading-relaxed text-gp-sub">
            Everyone starts on one unified GetPointr onboarding app with role-based accounts (General User, Helper, or
            Business). Families and occasional users get affordable peace of mind, while done-for-you Business Systems
            drive high-margin recurring revenue.
          </p>
        </div>

        <div className="rounded-2xl border border-gp-border bg-gp-card p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-gp-muted">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-gp-accent" /> Month-12 Revenue Mix
            </span>
            <span className="text-gp-sage">$15,895 / mo (~78% net margin)</span>
          </div>
          <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-gp-elevated p-0.5">
            <div style={{ width: "72%" }} className="h-full rounded-l-full bg-laser" title="Business Systems (72%)" />
            <div style={{ width: "15%" }} className="h-full bg-volt" title="Families Membership (15%)" />
            <div style={{ width: "9%" }} className="h-full bg-[#7d899b]" title="Onboarding App Ads (9%)" />
            <div style={{ width: "4%" }} className="h-full rounded-r-full bg-[#9dbcd8]" title="Per-Session Use (4%)" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-semibold">
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-laser" /> 72% Business Systems
            </span>
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-volt" /> 15% Families ($6.99/mo)
            </span>
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7d899b]" /> 9% App Sponsor Ads
            </span>
            <span className="flex items-center gap-2 text-gp-sub">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9dbcd8]" /> 4% Per-Session ($2.99)
            </span>
          </div>
        </div>
      </div>

      {/* 4 Revenue Streams */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {MONETIZATION_PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className="flex flex-col rounded-2xl border border-gp-border bg-gp-card p-5 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${p.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="text-right">
                  <div className="text-[1.15rem] font-extrabold text-gp-text">{p.price}</div>
                  <div className="text-[11px] font-semibold text-gp-muted">{p.unit}</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-gp-accent">{p.tag}</div>
              <h2 className="mt-0.5 text-[1.15rem] font-extrabold text-gp-text">{p.title}</h2>
              <p className="mt-1.5 text-[0.9rem] font-medium leading-relaxed text-gp-sub">{p.summary}</p>
              <div className="mt-3 rounded-xl bg-gp-elevated px-3 py-2 text-[12px] font-semibold text-gp-sub">
                <span className="font-bold text-gp-text">Who it is for: </span>
                {p.customers}
              </div>
              <ul className="mt-3 space-y-1.5 text-[0.86rem] font-medium text-gp-sub">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gp-sage" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* How the 2-Part System Works */}
      <div className="mt-8 rounded-2xl border border-gp-border bg-gp-card p-5 shadow-2xs">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gp-accent">
          <Smartphone className="h-4 w-4" /> How Our Platform Operates
        </div>
        <h3 className="mt-1 text-[1.2rem] font-extrabold text-gp-text">
          One Onboarding App, Three Tailored Experiences
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-gp-elevated p-3.5">
            <div className="text-[12px] font-bold uppercase tracking-wide text-gp-accent">1. General User Account</div>
            <p className="mt-1 text-[0.86rem] font-medium leading-relaxed text-gp-sub">
              Person needing help signs in once, sets privacy preferences, and opens the exact app or website they need
              guidance on while keeping 100% tap control.
            </p>
          </div>
          <div className="rounded-xl bg-gp-elevated p-3.5">
            <div className="text-[12px] font-bold uppercase tracking-wide text-gp-sage">2. Helper Account</div>
            <p className="mt-1 text-[0.86rem] font-medium leading-relaxed text-gp-sub">
              Trusted family members or support reps get role-based access controls, visual pointer tools (Rings,
              Arrows, Steps, Live Laser), and zero ability to tap remotely.
            </p>
          </div>
          <div className="rounded-xl bg-gp-elevated p-3.5">
            <div className="text-[12px] font-bold uppercase tracking-wide text-gp-text">3. Business Portal</div>
            <p className="mt-1 text-[0.86rem] font-medium leading-relaxed text-gp-sub">
              Separate organized platform with multi-seat helper managers, custom offline non-AI default help in Ask
              Help, plus analytics on top questions and client demographics.
            </p>
          </div>
        </div>
      </div>

      {/* Costs + Year-1 Numbers + Interactive Business Calculator */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Realistic Costs & Month-12 P&L */}
        <div className="flex flex-col justify-between rounded-2xl border border-gp-border bg-gp-card p-5 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gp-sage">
              <Wallet className="h-4 w-4" /> Realistic Costs &amp; Month-12 Numbers
            </div>
            <h3 className="mt-1 text-[1.18rem] font-extrabold text-gp-text">
              Lean Monthly Overhead, Strong Day-One Margins
            </h3>

            <div className="mt-4 divide-y divide-gp-border rounded-xl border border-gp-border bg-gp-elevated px-3.5 text-[0.86rem]">
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gp-sub">Core Tech (Vercel, Supabase, Stores, OTP)</span>
                <span className="font-mono font-bold text-gp-text">~$180 / mo</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gp-sub">Stripe &amp; App Store Fees (~3% web, 15% app)</span>
                <span className="font-mono font-bold text-gp-text">~$730 / mo</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gp-sub">B2B Setup Labor (2 new businesses/mo)</span>
                <span className="font-mono font-bold text-gp-text">~$1,000 / mo</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gp-sub">Marketing (Local Events, Geofenced &amp; Social)</span>
                <span className="font-mono font-bold text-gp-text">~$1,500 / mo</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-bold text-gp-text">Total Month-12 Operating Costs</span>
                <span className="font-mono font-extrabold text-gp-text">~$3,410 / mo</span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-gp-elevated p-3 text-[12px] font-medium text-gp-sub">
              <div className="flex items-center gap-1.5 font-bold text-gp-text">
                <MapPin className="h-3.5 w-3.5 text-gp-accent" /> Customer Acquisition Channels
              </div>
              <p className="mt-1 leading-relaxed">
                Local community &amp; senior events (~$15 CAC), geofenced ads around bank branches and senior centers
                (~$25 CAC), and short-form social media demos.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-gp-border bg-gp-surface p-3 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase text-gp-muted">Month-12 Rev</div>
              <div className="mt-0.5 font-mono text-[1.02rem] font-extrabold text-gp-text">$15,895/mo</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-gp-muted">Annual Run-Rate</div>
              <div className="mt-0.5 font-mono text-[1.02rem] font-extrabold text-gp-accent">$190,740/yr</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-gp-muted">Net Profit</div>
              <div className="mt-0.5 font-mono text-[1.02rem] font-extrabold text-gp-sage">+$12,485/mo</div>
            </div>
          </div>
        </div>

        {/* Simple Business Savings Calculator */}
        <div className="flex flex-col justify-between rounded-2xl border border-gp-border bg-gp-card p-5 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gp-accent">
              <Calculator className="h-4 w-4" /> Business Customer Savings Estimator
            </div>
            <h3 className="mt-1 text-[1.18rem] font-extrabold text-gp-text">
              Why Businesses Happily Pay $499 - $1,299/mo
            </h3>
            <p className="mt-1 text-[0.86rem] font-medium text-gp-sub">
              Slide to estimate how many support phone calls a business replaces each month using GetPointr visual
              guidance and offline non-AI help flows:
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-[0.86rem] font-bold">
                  <label htmlFor="calls-slider" className="text-gp-sub">
                    Phone Calls Replaced per Month
                  </label>
                  <span className="font-mono text-gp-text">{replacedCalls.toLocaleString()} calls</span>
                </div>
                <input
                  id="calls-slider"
                  type="range"
                  min={50}
                  max={1500}
                  step={25}
                  value={replacedCalls}
                  onChange={(e) => setReplacedCalls(Number(e.target.value))}
                  className="mt-1.5 w-full cursor-pointer accent-laser"
                />
              </div>

              <div>
                <div className="flex justify-between text-[0.86rem] font-bold">
                  <label htmlFor="cost-slider" className="text-gp-sub">
                    Average Cost per Phone Support Call
                  </label>
                  <span className="font-mono text-gp-text">${costPerCall} / call</span>
                </div>
                <input
                  id="cost-slider"
                  type="range"
                  min={10}
                  max={28}
                  step={1}
                  value={costPerCall}
                  onChange={(e) => setCostPerCall(Number(e.target.value))}
                  className="mt-1.5 w-full cursor-pointer accent-laser"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gp-elevated p-3.5 text-center">
              <div>
                <div className="text-[10px] font-bold uppercase text-gp-muted">Suggested Plan</div>
                <div className="mt-0.5 text-[0.86rem] font-extrabold text-gp-text">{planName}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-gp-muted">Call Costs Saved</div>
                <div className="mt-0.5 font-mono text-[1.02rem] font-extrabold text-gp-accent">
                  ${grossSaved.toLocaleString()}/mo
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-gp-muted">Net Client Savings</div>
                <div className="mt-0.5 font-mono text-[1.02rem] font-extrabold text-gp-sage">
                  +${netMonthlySavings.toLocaleString()}/mo
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-gp-border bg-gp-surface px-3.5 py-2.5 text-[12px] font-semibold text-gp-sub">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gp-sage" />
              Replacing just ~32 support calls a month pays for the entire $499/mo Business Starter plan.
            </div>
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
      aria-label="GetPointr Monetization Plan"
      className="fixed inset-0 z-50 overflow-y-auto bg-gp-bg/95 p-4 backdrop-blur-md sm:p-8"
    >
      <div className="gp-rise rounded-3xl border border-gp-border bg-gp-surface p-5 shadow-2xl sm:p-8">
        <MonetizationContent onClose={onClose} />
      </div>
    </div>
  );
}
