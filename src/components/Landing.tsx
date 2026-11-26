"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Ban,
  EyeOff,
  Hand,
  KeyRound,
  Laptop,
  QrCode,
  ScanLine,
  Smartphone,
  Zap,
} from "lucide-react";
import MockBankApp from "./MockBankApp";
import { Stage } from "./Stage";
import { CaptionBubble, GuideMarker } from "./Markers";
import { Logo } from "./Logo";
import { newRoomId, normalizeRoom } from "@/lib/ids";
import { INITIAL_STATE } from "@/lib/types";

const FEATURES = [
  {
    icon: Ban,
    title: "Zero takeover",
    body: "Helpers can point with laser rings, arrows and numbered steps — but there is no API to tap, type or click on your device.",
  },
  {
    icon: KeyRound,
    title: "Trusted Circle pairing",
    body: "Devices pair in person first. Cold-call scammers can't connect, because their device isn't in your circle.",
  },
  {
    icon: EyeOff,
    title: "On-device privacy masking",
    body: "Balances, passwords and 2FA codes are blurred on your phone before anything is shared with the helper.",
  },
  {
    icon: Zap,
    title: "No install, no account",
    body: "Scan a QR code or tap a text link. The session opens in the browser in seconds — on any phone.",
  },
];

const STEPS = [
  { icon: ScanLine, title: "Scan", body: "The person who needs help scans a QR code. No app, no sign-up." },
  { icon: Hand, title: "Point", body: "The helper sees a live mirror and drops glowing pointers onto it." },
  { icon: Smartphone, title: "You tap", body: "Pointers appear on your phone. You stay in control of every tap." },
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
    <div className="relative min-h-dvh overflow-x-hidden bg-ink-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(60%_50%_at_70%_20%,rgba(255,107,26,0.18),transparent_70%),radial-gradient(50%_40%_at_10%_10%,rgba(139,92,246,0.16),transparent_70%)]"
      />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo size={30} />
        <a href="#how" className="rounded-lg px-3 py-2 text-[14px] text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
          How it works
        </a>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[12px] font-medium text-slate-300 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-laser" /> Remote help without remote control
          </span>
          <h1 className="mt-5 text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[56px]">
            Point the way.
            <br />
            <span className="text-laser">Never take over.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-300">
            GetPointr lets a trusted helper guide someone through their phone with glowing visual cues — while the
            owner keeps 100% control. No installs, no screen hijacking, no scammer access.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => start("host")}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-laser px-5 py-4 text-left shadow-lg shadow-laser/25 transition-colors hover:bg-orange-500"
            >
              <Smartphone className="h-6 w-6 shrink-0" />
              <span className="flex-1">
                <span className="block text-[16px] font-semibold">Try it on this phone</span>
                <span className="block text-[13px] text-orange-100">Guided demo starts automatically</span>
              </span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => start("helper")}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 text-left ring-1 ring-white/15 transition-colors hover:bg-white/10"
            >
              <Laptop className="h-6 w-6 shrink-0 text-volt" />
              <span className="flex-1">
                <span className="block text-[16px] font-semibold">I&apos;m the helper</span>
                <span className="block text-[13px] text-slate-400">Open the console, show a QR</span>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <form onSubmit={join} className="mt-4 flex max-w-xl items-center gap-2">
            <label htmlFor="code" className="sr-only">Session code</label>
            <div className="relative flex-1">
              <QrCode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Have a code? e.g. K7M2QX"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={12}
                className="h-12 w-full rounded-xl bg-ink-900 pl-9 pr-3 font-mono text-[16px] tracking-widest text-white ring-1 ring-white/10 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:ring-laser"
              />
            </div>
            <button
              type="submit"
              disabled={normalizeRoom(code).length < 4}
              className="h-12 cursor-pointer rounded-xl bg-white/10 px-5 text-[15px] font-semibold transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Join
            </button>
          </form>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-10 rounded-full bg-laser/10 blur-3xl" />
            <Stage height={780} scale={0.66} innerRef={heroStage} framed className="relative">
              <MockBankApp state={INITIAL_STATE} />
              <GuideMarker target="send" stageRef={heroStage} scale={0.66} />
              <CaptionBubble from="Alex · Trusted helper" text="Tap “Send money” — right where the ring is." />
            </Stage>
          </div>
        </div>
      </section>

      <section id="how" className="relative z-10 border-t border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-[28px] font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-2xl bg-ink-800/70 p-5 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-laser text-[15px] font-bold">{i + 1}</span>
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="mt-4 text-[18px] font-semibold">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl p-5 ring-1 ring-white/10">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-laser/15 text-laser">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-[13px] text-slate-500 sm:flex-row sm:justify-between">
        <span>GetPointr prototype · “Harbor Credit Union” is a fictional demo bank.</span>
        <span>No screen content is transmitted or stored — only pointer metadata.</span>
      </footer>
    </div>
  );
}
