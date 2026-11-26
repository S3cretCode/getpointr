"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  EyeOff,
  Hand,
  KeyRound,
  Laptop,
  Lock,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import MockBankApp from "./MockBankApp";
import { Stage } from "./Stage";
import { CaptionBubble, GuideMarker } from "./Markers";
import { Logo } from "./Logo";
import { AppearanceBar } from "@/lib/preferences";
import { newRoomId, normalizeRoom } from "@/lib/ids";
import { INITIAL_STATE } from "@/lib/types";

const FEATURES = [
  {
    icon: Ban,
    title: "Zero takeover",
    body: "Helpers guide with glowing rings, arrows, laser trails, and numbered steps. There is no API to tap, type, or click on your device.",
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
  {
    icon: Zap,
    title: "No install, no account",
    body: "Scan a QR code or tap a text link. The session opens in the browser in seconds on any phone.",
  },
];

const STEPS = [
  { icon: ScanLine, title: "Scan", body: "The person who needs help scans a QR code. No app store download and no sign-up." },
  { icon: Hand, title: "Point", body: "The helper sees a live view-only mirror and places clear visual pointers onto it." },
  { icon: Smartphone, title: "You tap", body: "Pointers appear on your phone with optional replay. You stay in control of every tap." },
];

export default function Landing() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const heroStage = useRef<HTMLDivElement>(null);

  const start = (as: "host" | "helper") => router.push(`/${as}/${newRoomId()}`);

  const join = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeRoom(code);
    if (c.length >= 4) router.push(`/host/${c}`);
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-gp-bg text-gp-text">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(58%_48%_at_72%_22%,rgba(255,100,20,0.2),transparent_70%),radial-gradient(50%_40%_at_12%_12%,rgba(124,58,237,0.16),transparent_70%)]"
      />

      <nav className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <Logo size={32} />
        <div className="flex items-center gap-3">
          <a
            href="#how"
            className="hidden rounded-lg px-3 py-2 text-[0.9rem] font-semibold text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text sm:inline-block"
          >
            How it works
          </a>
          <AppearanceBar />
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-18 pt-4 lg:grid-cols-[1.06fr_0.94fr] lg:pt-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gp-border bg-gp-card px-3.5 py-1.5 text-[0.78rem] font-bold tracking-wide text-gp-sub">
            <span className="h-2 w-2 rounded-full bg-laser" /> Remote help without remote control
          </span>
          <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.06] tracking-tight sm:text-[3.5rem]">
            Point the way.
            <br />
            <span className="text-laser">Never take over.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[1.06rem] font-medium leading-relaxed text-gp-sub">
            GetPointr lets a trusted helper guide someone through their phone with glowing visual cues while the device
            owner keeps 100% control. No installs, no screen hijacking, and no scammer access.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => start("host")}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-laser px-5 py-4 text-left text-white shadow-lg shadow-laser/30 transition-colors hover:bg-orange-600"
            >
              <Smartphone className="h-6 w-6 shrink-0" />
              <span className="flex-1">
                <span className="block text-[1rem] font-bold">Try it on this phone</span>
                <span className="block text-[0.82rem] font-medium text-orange-50">Guided demo starts automatically</span>
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
                <span className="block text-[0.82rem] font-medium text-gp-muted">Open the console &amp; show QR</span>
              </span>
              <ArrowRight className="h-5 w-5 text-gp-muted transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <form onSubmit={join} className="mt-4 flex max-w-xl items-center gap-2">
            <label htmlFor="code" className="sr-only">
              Session code
            </label>
            <div className="relative flex-1">
              <QrCode className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gp-muted" />
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Have a code? e.g. K7M2QX"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={12}
                className="h-12 w-full rounded-xl border border-gp-border bg-gp-surface pl-10 pr-3 font-mono text-[1rem] font-semibold tracking-widest text-gp-text placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-gp-muted focus:outline-none focus:ring-2 focus:ring-laser"
              />
            </div>
            <button
              type="submit"
              disabled={normalizeRoom(code).length < 4}
              className="h-12 cursor-pointer rounded-xl border border-gp-border bg-gp-card px-5 text-[0.95rem] font-bold text-gp-text transition-colors hover:bg-gp-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              Join
            </button>
          </form>
        </div>

        {/* Upgraded multi-card Hero visual */}
        <div className="relative flex justify-center py-4 lg:justify-end">
          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-12 rounded-full bg-laser/15 blur-3xl" />

            {/* Top-left callout: Trusted Circle Helper Console */}
            <div className="gp-float absolute -left-4 top-6 z-20 hidden w-[212px] rounded-2xl border border-gp-border bg-gp-surface/95 p-3 shadow-2xl backdrop-blur sm:block lg:-left-16">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                <ShieldCheck className="h-4 w-4 shrink-0" /> Trusted Circle
              </div>
              <div className="mt-1 text-[13px] font-bold text-gp-text">Alex&apos;s Laptop</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-gp-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> View-only · 0 remote taps
              </div>
            </div>

            {/* Right callout: Live Privacy Shield comparison */}
            <div
              className="gp-float absolute -right-3 top-36 z-20 hidden w-[205px] rounded-2xl border border-gp-border bg-gp-surface/95 p-3 shadow-2xl backdrop-blur sm:block lg:-right-8"
              style={{ animationDelay: "1.1s" }}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-laser">
                <Lock className="h-3.5 w-3.5" /> Privacy Shield ON
              </div>
              <div className="mt-2 space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between rounded-lg bg-gp-elevated px-2 py-1">
                  <span className="font-semibold text-gp-muted">Owner sees</span>
                  <span className="font-mono font-bold text-emerald-500">$5,240.18</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gp-elevated px-2 py-1">
                  <span className="font-semibold text-gp-muted">Helper sees</span>
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    Hidden
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom-left callout: Zero-Takeover guarantee */}
            <div
              className="gp-float absolute -left-4 bottom-8 z-20 hidden items-center gap-2.5 rounded-2xl border border-gp-border bg-gp-surface/95 px-3.5 py-2.5 shadow-2xl backdrop-blur sm:flex lg:-left-12"
              style={{ animationDelay: "2.1s" }}
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-laser/15 text-laser">
                <Ban className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <div className="text-[12px] font-bold text-gp-text">Zero-Takeover Canvas</div>
                <div className="text-[11px] font-medium text-gp-muted">Pointer cues + instant replay</div>
              </div>
            </div>

            <Stage height={760} scale={0.65} innerRef={heroStage} framed className="relative z-10">
              <MockBankApp state={INITIAL_STATE} />
              <GuideMarker target="send" stageRef={heroStage} scale={0.65} tool="arrow" />
              <CaptionBubble from="Alex · Trusted helper" text="Tap “Send money” right where the ring is pulsing." />
            </Stage>
          </div>
        </div>
      </section>

      <section id="how" className="relative z-10 border-t border-gp-border bg-gp-surface/65">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-[1.8rem] font-extrabold tracking-tight text-gp-text">How it works</h2>
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

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
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

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-[0.85rem] font-medium text-gp-muted sm:flex-row sm:justify-between">
        <span>GetPointr prototype · “Harbor Credit Union” is a fictional demo bank.</span>
        <span>No screen content is transmitted or stored. Only pointer metadata is sent.</span>
      </footer>
    </div>
  );
}
