"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Cpu,
  DollarSign,
  Eye,
  EyeOff,
  Hand,
  Hash,
  KeyRound,
  Laptop,
  Lock,
  MousePointer2,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import MockBankApp, { ShieldContext } from "./MockBankApp";
import { Stage } from "./Stage";
import { CaptionBubble, GuideMarker, MarkerLayer, type TapRipple } from "./Markers";
import { Logo } from "./Logo";
import MonetizationModal, { MONETIZATION_PILLARS } from "./MonetizationModal";
import { AppearanceBar } from "@/lib/preferences";
import { newRoomId, normalizeRoom } from "@/lib/ids";
import { INITIAL_STATE, type AppState, type Marker, type Pt } from "@/lib/types";

const FEATURES = [
  {
    icon: Ban,
    title: "Zero takeover",
    body: "Helpers guide with glowing rings, arrows, laser trails, and numbered steps. There is no API to tap, type, or click on your device.",
  },
  {
    icon: Cpu,
    title: "100% On-Device Local AI",
    body: "Need instant help alone? Type any task and an in-browser local algorithm guides you step by step with the exact same Privacy Shield protection.",
  },
  {
    icon: KeyRound,
    title: "Trusted Circle pairing",
    body: "Devices pair in person first. Cold-call scammers cannot connect because their device is not in your trusted circle.",
  },
  {
    icon: EyeOff,
    title: "Mandatory privacy masking",
    body: "Balances, passwords, session preferences, and 2FA codes stay blurred on the helper side before anything is shared.",
  },
];

const STEPS = [
  { icon: ScanLine, title: "Scan or Ask", body: "Scan a QR code to link with a trusted helper, or type what you need for instant Local AI guidance." },
  { icon: Hand, title: "Visual Pointers", body: "Your helper (or on-device Local AI) places rings, arrows, numbered steps, or a slow laser onto a masked mirror." },
  { icon: Smartphone, title: "You Tap", body: "Pointers appear on your phone with per-screen replay. You stay in control of every single tap." },
];

type HeroScene = {
  id: string;
  label: string;
  icon: typeof MousePointer2;
  state: AppState;
  guideTarget?: string;
  guideTool?: "ring" | "arrow";
  markers: Marker[];
  laserSweep?: Pt[];
  tap?: TapRipple;
  from: string;
  caption: string;
};

// Sweeps a smooth figure-8 / arc across the visible middle of the Confirm screen (above CaptionBubble)
const LASER_SWEEP_PTS: Pt[] = Array.from({ length: 22 }, (_, i) => {
  const k = i / 21;
  const angle = k * Math.PI * 1.65 - 0.3;
  return {
    x: 195 + Math.cos(angle) * 118,
    y: 355 + Math.sin(angle * 2) * 52,
  };
});

const HERO_SCENES: HeroScene[] = [
  {
    id: "arrow",
    label: "1. Arrow Cue",
    icon: MousePointer2,
    state: INITIAL_STATE,
    guideTarget: "send",
    guideTool: "arrow",
    markers: [],
    from: "Alex · Trusted helper",
    caption: "Tap “Send money” right where the arrow is pointing.",
  },
  {
    id: "steps",
    label: "2. Steps 1-2-3",
    icon: Hash,
    state: { ...INITIAL_STATE, screen: "transfer", payee: "Mom", amount: 50 },
    markers: [
      { id: "s1", x: 52, y: 205, tool: "step", step: 1, done: true },
      { id: "s2", x: 148, y: 386, tool: "step", step: 2, done: true },
      { id: "s3", x: 195, y: 658, tool: "step", step: 3, done: false },
    ],
    tap: { id: "t1", x: 148, y: 386 },
    from: "Alex · Step sequence",
    caption: "Steps 1 and 2 done! Now tap Step 3 on “Continue”.",
  },
  {
    id: "laser",
    label: "3. Live Laser",
    icon: Sparkles,
    state: { ...INITIAL_STATE, screen: "confirm", payee: "Mom", amount: 50, smsShown: true },
    markers: [],
    laserSweep: LASER_SWEEP_PTS,
    from: "Alex · Live laser",
    caption: "Your 2FA code stays blurred to Hidden. Tap “Confirm & send” below.",
  },
  {
    id: "local-ai",
    label: "4. Local AI",
    icon: Cpu,
    state: { ...INITIAL_STATE, screen: "settings", cardLocked: true },
    guideTarget: "toggle-cardlocked",
    guideTool: "ring",
    markers: [],
    from: "On-Device Local AI",
    caption: "100% local in-browser AI: Tap this switch to lock your debit card.",
  },
];

export default function Landing() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [monetizationOpen, setMonetizationOpen] = useState(false);

  // Dynamic Hero Showcase state
  const [sceneIdx, setSceneIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [previewShield, setPreviewShield] = useState(true);
  const [laserStep, setLaserStep] = useState(0);
  const heroStage = useRef<HTMLDivElement>(null);

  const scene = HERO_SCENES[sceneIdx];

  // Auto-advance hero phone through pages and pointer modes
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setSceneIdx((prev) => (prev + 1) % HERO_SCENES.length);
    }, 3900);
    return () => clearInterval(t);
  }, [paused]);

  // Animate the slow laser drag trail when Scene 3 ("laser") is active
  useEffect(() => {
    if (!scene.laserSweep) return;
    let i = 1;
    const iv = setInterval(() => {
      i = (i % (scene.laserSweep!.length + 5)) + 1;
      setLaserStep(i);
    }, 90);
    return () => clearInterval(iv);
  }, [scene]);

  const activeTrail = scene.laserSweep
    ? scene.laserSweep.slice(Math.max(0, laserStep - 11), Math.min(scene.laserSweep.length, Math.max(2, laserStep + 1)))
    : [];

  const start = (as: "host" | "helper") => router.push(`/${as}/${newRoomId()}`);

  const startLocalAi = (e: FormEvent) => {
    e.preventDefault();
    const q = aiPrompt.trim() || "Send $50 to Mom";
    router.push(`/host/${newRoomId()}?ai=${encodeURIComponent(q)}`);
  };

  const join = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeRoom(code);
    if (c.length >= 4) router.push(`/host/${c}`);
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-gp-bg text-gp-text">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(58%_48%_at_72%_22%,rgba(255,100,20,0.18),transparent_70%),radial-gradient(50%_40%_at_12%_12%,rgba(124,58,237,0.14),transparent_70%)]"
      />

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <Logo size={32} />
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#how"
            className="hidden rounded-lg px-3 py-2 text-[0.9rem] font-semibold text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text md:inline-block"
          >
            How it works
          </a>
          <button
            type="button"
            onClick={() => setMonetizationOpen(true)}
            className="hidden cursor-pointer rounded-lg px-3 py-2 text-[0.9rem] font-semibold text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text sm:inline-block"
          >
            Monetization
          </button>
          <AppearanceBar />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-4 xl:grid-cols-[1fr_auto] xl:gap-10 xl:pt-8">
        <div>
          {/* Creative editorial contrast strip (no generic AI circle pill) */}
          <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 border-l-[3px] border-laser pl-3 text-[0.82rem] font-bold uppercase tracking-wider">
            <span className="text-gp-muted line-through decoration-rose-500 decoration-2">Screen takeover</span>
            <span className="text-gp-border">/</span>
            <span className="text-gp-muted line-through decoration-rose-500 decoration-2">App downloads</span>
            <span className="text-gp-border">/</span>
            <span className="text-laser">100% Owner-Controlled</span>
          </div>

          <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1.06] tracking-tight sm:text-[3.55rem]">
            Point the way.
            <br />
            <span className="text-laser">Never take over.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[1.05rem] font-medium leading-relaxed text-gp-sub">
            GetPointr lets a trusted family member, support rep, or 100% on-device Local AI guide someone through their
            phone with glowing visual cues while sensitive balances and 2FA codes stay blurred.
          </p>

          {/* Primary CTAs */}
          <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => start("host")}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-laser px-5 py-4 text-left text-white shadow-lg shadow-laser/30 transition-colors hover:bg-orange-600"
            >
              <Smartphone className="h-6 w-6 shrink-0" />
              <span className="flex-1">
                <span className="block text-[1rem] font-bold">Try it on this phone</span>
                <span className="block text-[0.82rem] font-medium text-orange-50">Interactive phone session</span>
              </span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => start("helper")}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-gp-border bg-gp-card px-5 py-4 text-left shadow-sm transition-colors hover:bg-gp-hover"
            >
              <Laptop className="h-6 w-6 shrink-0 text-volt" />
              <span className="flex-1">
                <span className="block text-[1rem] font-bold text-gp-text">I&apos;m the helper</span>
                <span className="block text-[0.82rem] font-medium text-gp-muted">Open console &amp; show QR</span>
              </span>
              <ArrowRight className="h-5 w-5 text-gp-muted transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Instant On-Device Local AI launcher right on the landing page */}
          <form
            onSubmit={startLocalAi}
            className="mt-3 max-w-xl rounded-2xl border border-gp-border bg-gp-card p-3 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 text-emerald-500">
                <Cpu className="h-3.5 w-3.5" /> Automated On-Device Local AI Guide
              </span>
              <span className="text-gp-muted">Runs in browser · Privacy Shield ON</span>
            </div>
            <div className="mt-2 flex gap-2">
              <label htmlFor="landing-ai" className="sr-only">
                Ask Local AI for help
              </label>
              <input
                id="landing-ai"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Type a need, e.g. “Send $100 to Sarah” or “Lock my debit card”"
                className="h-11 min-w-0 flex-1 rounded-xl border border-gp-border bg-gp-bg px-3.5 text-[0.92rem] font-medium text-gp-text placeholder:text-gp-muted focus:outline-none focus:ring-2 focus:ring-laser"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-volt px-4 text-[0.9rem] font-bold text-white transition-colors hover:bg-violet-600"
              >
                Guide me <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Join by room code */}
          <form onSubmit={join} className="mt-3 flex max-w-xl items-center gap-2">
            <label htmlFor="code" className="sr-only">
              Session code
            </label>
            <div className="relative flex-1">
              <QrCode className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gp-muted" />
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Have a 6-digit room code? e.g. K7M2QX"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={12}
                className="h-11 w-full rounded-xl border border-gp-border bg-gp-surface pl-10 pr-3 font-mono text-[0.95rem] font-semibold tracking-widest text-gp-text placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-gp-muted focus:outline-none focus:ring-2 focus:ring-laser"
              />
            </div>
            <button
              type="submit"
              disabled={normalizeRoom(code).length < 4}
              className="h-11 cursor-pointer rounded-xl border border-gp-border bg-gp-card px-5 text-[0.92rem] font-bold text-gp-text transition-colors hover:bg-gp-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              Join
            </button>
          </form>
        </div>

        {/* Right Column: Unobstructed Dynamic iPhone + Side Callout Rail */}
        <div
          className="relative flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Side rail positioned cleanly BESIDE the iPhone so 0% of the screen is covered */}
          <div className="order-2 flex w-full max-w-[320px] flex-col gap-3 md:order-1 md:w-[218px]">
            <div className="gp-float rounded-2xl border border-gp-border bg-gp-surface p-3.5 shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                <ShieldCheck className="h-4 w-4 shrink-0" /> Trusted Circle
              </div>
              <div className="mt-1 text-[13px] font-bold text-gp-text">Alex&apos;s Laptop</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-gp-muted">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Paired in person · 0 remote taps
              </div>
            </div>

            <div
              className="gp-float rounded-2xl border border-gp-border bg-gp-surface p-3.5 shadow-lg"
              style={{ animationDelay: "1.1s" }}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-laser">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Privacy Shield
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewShield((s) => !s)}
                  className="cursor-pointer rounded-md border border-gp-border bg-gp-elevated px-1.5 py-0.5 text-[10px] font-bold text-gp-text hover:bg-gp-hover"
                >
                  {previewShield ? "ON" : "OFF"}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] font-medium leading-snug text-gp-sub">
                {previewShield
                  ? "Personal balances & 2FA codes on the iPhone are blurred right now, just as a helper or Local AI sees them."
                  : "Unblurred owner view: click OFF/ON above to compare."}
              </p>
              <button
                type="button"
                onClick={() => setPreviewShield((s) => !s)}
                className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gp-elevated py-1.5 text-[11px] font-bold text-gp-text transition-colors hover:bg-gp-hover"
              >
                {previewShield ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {previewShield ? "Peek unblurred owner view" : "Re-enable Privacy Blur"}
              </button>
            </div>

            <div
              className="gp-float rounded-2xl border border-gp-border bg-gp-surface p-3.5 shadow-lg"
              style={{ animationDelay: "2.1s" }}
            >
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-volt">
                <Cpu className="h-4 w-4 shrink-0" /> Local AI Ready
              </div>
              <div className="mt-1 text-[12px] font-medium leading-snug text-gp-sub">
                100% in-browser guidance when no human helper is online.
              </div>
            </div>
          </div>

          {/* Unobstructed Dynamic Cycling iPhone */}
          <div className="order-1 flex flex-col items-center md:order-2">
            <div className="relative">
              <div aria-hidden="true" className="pointer-events-none absolute -inset-10 rounded-full bg-laser/15 blur-3xl" />
              <Stage height={760} scale={0.64} innerRef={heroStage} framed className="relative z-10">
                <ShieldContext.Provider value={previewShield}>
                  <MockBankApp state={scene.state} />
                </ShieldContext.Provider>
                <MarkerLayer
                  markers={scene.markers}
                  trail={activeTrail}
                  taps={scene.tap ? [scene.tap] : []}
                />
                {scene.guideTarget && (
                  <GuideMarker
                    key={`${scene.id}-${scene.guideTarget}`}
                    target={scene.guideTarget}
                    stageRef={heroStage}
                    scale={0.64}
                    tool={scene.guideTool ?? "ring"}
                  />
                )}
                <CaptionBubble from={scene.from} text={scene.caption} />
              </Stage>
            </div>

            {/* Interactive Scene Selector Pills */}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Preview scenes">
              {HERO_SCENES.map((s, idx) => {
                const Icon = s.icon;
                const active = idx === sceneIdx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setSceneIdx(idx);
                      setPaused(true);
                    }}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      active
                        ? "border-laser bg-laser text-white shadow-xs"
                        : "border-gp-border bg-gp-card text-gp-sub hover:bg-gp-hover"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works & Core Moat */}
      <section id="how" className="relative z-10 border-t border-gp-border bg-gp-surface/65">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <h2 className="text-[1.85rem] font-extrabold tracking-tight text-gp-text">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-2xl border border-gp-border bg-gp-card p-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-laser text-[15px] font-extrabold text-white">
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5 text-gp-muted" />
                </div>
                <h3 className="mt-4 text-[1.12rem] font-bold text-gp-text">{title}</h3>
                <p className="mt-1.5 text-[0.95rem] font-medium leading-relaxed text-gp-sub">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-gp-border bg-gp-card p-5 shadow-xs">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-laser/15 text-laser">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[1.06rem] font-bold text-gp-text">{title}</h3>
                  <p className="mt-1 text-[0.94rem] font-medium leading-relaxed text-gp-sub">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monetization Section (Clickable -> Opens Full Blueprint Page Popup) */}
      <section id="monetization" className="relative z-10 border-t border-gp-border bg-gp-bg">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-laser">
                <DollarSign className="h-4 w-4" /> Business Model &amp; Enterprise Scale
              </div>
              <h2 className="mt-1 text-[1.9rem] font-extrabold tracking-tight text-gp-text">Monetization</h2>
              <p className="mt-2 max-w-2xl text-[0.98rem] font-medium leading-relaxed text-gp-sub">
                GetPointr pairs high-margin B2B White-Label SDK licensing for banks and healthcare portals with
                per-seat support SaaS and a viral freemium Family Plus circle. Click any tier below to open the full
                unit economics and interactive credit-union ROI calculator.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMonetizationOpen(true)}
              className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-2xl bg-laser px-5 text-[0.95rem] font-bold text-white shadow-lg shadow-laser/25 transition-colors hover:bg-orange-600"
            >
              Open Full Monetization Blueprint <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>

          {/* Clickable Visual Summary Card + 4 Revenue Streams */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MONETIZATION_PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setMonetizationOpen(true)}
                  className="group flex cursor-pointer flex-col rounded-2xl border border-gp-border bg-gp-card p-5 text-left shadow-xs transition-all duration-150 hover:border-laser hover:bg-gp-hover"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${p.accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-gp-border bg-gp-elevated px-2.5 py-0.5 font-mono text-[11px] font-bold text-gp-text">
                      {p.barPct}% ARR
                    </span>
                  </div>
                  <div className="mt-4 font-mono text-[1.15rem] font-extrabold text-gp-text">{p.price}</div>
                  <h3 className="mt-1 text-[1rem] font-bold text-gp-text group-hover:text-laser">{p.title}</h3>
                  <p className="mt-1.5 line-clamp-3 text-[0.86rem] font-medium leading-relaxed text-gp-sub">
                    {p.summary}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[12px] font-bold text-laser">
                    View unit economics <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col gap-2 border-t border-gp-border px-5 py-8 text-[0.85rem] font-medium text-gp-muted sm:flex-row sm:justify-between">
        <span>GetPointr prototype · “Harbor Credit Union” is a fictional demo bank.</span>
        <span className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-laser" /> No screen pixels are transmitted or stored. Only pointer metadata is sent.
        </span>
      </footer>

      <MonetizationModal open={monetizationOpen} onClose={() => setMonetizationOpen(false)} />
    </div>
  );
}
