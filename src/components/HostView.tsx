"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import {
  Ban,
  Check,
  Copy,
  EyeOff,
  KeyRound,
  Laptop,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import MockBankApp from "./MockBankApp";
import { Stage, W, FRAME_PAD, IPHONE_CHROME_H } from "./Stage";
import { GuideMarker, MarkerLayer } from "./Markers";
import { Logo } from "./Logo";
import { useRoom, type SendFn } from "@/lib/room";
import { applyAction } from "@/lib/bank";
import { formatClock, useElementSize, useOrigin } from "@/lib/hooks";
import {
  HELPER_NAME,
  HELPER_SHORT,
  INITIAL_STATE,
  type AppState,
  type BankAction,
  type Marker,
  type Pt,
  type RoomEvent,
} from "@/lib/types";

type Guide = "idle" | "offer" | "running";

function guideFor(s: AppState): { target: string | null; text: string } {
  switch (s.screen) {
    case "home":
      return { target: "send", text: "Hi Margaret! Let's send $50 to Mom. Tap “Send money” where the ring is pulsing." };
    case "transfer":
      if (!s.payee) return { target: "payee-mom", text: "Now choose who you're paying — tap Mom." };
      if (!s.amount) return { target: "amt-50", text: "Pick the amount — tap $50." };
      return { target: "continue", text: "Looks right. Tap Continue." };
    case "confirm":
      if (!s.smsShown) return { target: null, text: "Hang on — your bank is texting you a code…" };
      return {
        target: "confirm",
        text: "A code just arrived. Your helper sees it blurred — and should never ask for it. Tap “Confirm & send”.",
      };
    case "success":
      return { target: null, text: "That's it! You made every tap yourself — the helper never touched your phone." };
    case "settings":
      return { target: "tab-home", text: "Let's head back — tap Home." };
  }
}

function buzz(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive) {
    navigator.vibrate?.(pattern);
  }
}

export default function HostView({ room }: { room: string }) {
  const origin = useOrigin();
  const helperUrl = origin ? `${origin}/helper/${room}` : "";

  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const stateRef = useRef(state);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const [trail, setTrail] = useState<Pt[]>([]);
  const trailTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [caption, setCaption] = useState<{ id: string; text: string } | null>(null);
  const captionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [shieldOn, setShieldOn] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [guide, setGuide] = useState<Guide>("idle");
  const [countdown, setCountdown] = useState(6);
  const [sheet, setSheet] = useState<null | "invite">(null);
  const [ended, setEnded] = useState<null | { by: "you" | "helper"; duration: number; pointers: number }>(null);
  const [copied, setCopied] = useState(false);

  const startedAt = useRef(0);
  const received = useRef(0);
  const peerRef = useRef(false);
  const hRef = useRef(800);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mainRef, size] = useElementSize<HTMLDivElement>();

  // ---- Layout: full-bleed on phones, framed phone on wide screens ----------
  const fill = size.w > 0 && size.w < 640;
  let H = 800;
  let scale = 1;
  if (fill) {
    scale = size.w / W;
    H = Math.max(520, Math.round(size.h / scale));
    if (H * scale > size.h) scale = size.h / H;
  } else if (size.w > 0) {
    scale = Math.min((size.h - 32 - FRAME_PAD * 2) / (H + IPHONE_CHROME_H), (size.w - 32 - FRAME_PAD * 2) / W, 1.05);
  }

  const setMarkersBoth = (m: Marker[]) => {
    markersRef.current = m;
    setMarkers(m);
  };

  const showCaption = (text: string) => {
    const id = Math.random().toString(36).slice(2);
    setCaption({ id, text });
    clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => setCaption(null), 9000);
  };

  const handleEvent = (e: RoomEvent, emit: SendFn) => {
    switch (e.type) {
      case "markers": {
        const known = new Set(markersRef.current.map((m) => m.id));
        const fresh = e.markers.filter((m) => !known.has(m.id));
        if (fresh.length) {
          received.current += fresh.length;
          buzz(35);
        }
        setMarkersBoth(e.markers);
        break;
      }
      case "laser":
        setTrail((t) => [...t.slice(-9), { x: e.x, y: e.y }]);
        clearTimeout(trailTimer.current);
        trailTimer.current = setTimeout(() => setTrail([]), 700);
        break;
      case "laser-end":
        clearTimeout(trailTimer.current);
        trailTimer.current = setTimeout(() => setTrail([]), 250);
        break;
      case "say":
        showCaption(e.text);
        break;
      case "shield":
        setShieldOn(e.on);
        break;
      case "sync":
        emit({ type: "state", state: stateRef.current });
        emit({ type: "viewport", h: hRef.current });
        break;
      case "end":
        setEnded({ by: "helper", duration: Date.now() - startedAt.current, pointers: received.current });
        break;
    }
  };

  const handlePeer = (present: boolean, emit: SendFn) => {
    peerRef.current = present;
    if (present) {
      setGuide("idle");
      setSheet(null);
      setEnded(null);
      emit({ type: "state", state: stateRef.current });
      emit({ type: "viewport", h: hRef.current });
      emit({ type: "sync" });
    }
  };

  const { send, peer } = useRoom(room, "host", handleEvent, handlePeer);

  useEffect(() => {
    hRef.current = H;
    if (peer) send({ type: "viewport", h: H });
  }, [H, peer, send]);

  // Verification animation, then offer the guided demo if nobody joined.
  useEffect(() => {
    startedAt.current = Date.now();
    const v = setTimeout(() => setVerifying(false), 2700);
    const o = setTimeout(() => {
      if (!peerRef.current) {
        setCountdown(6);
        setGuide((g) => (g === "idle" ? "offer" : g));
      }
    }, 6500);
    return () => {
      clearTimeout(v);
      clearTimeout(o);
    };
  }, []);

  useEffect(() => {
    if (guide !== "offer") return;
    let n = 6;
    const iv = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(iv);
        setGuide("running");
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [guide]);

  // ---- Owner actions ------------------------------------------------------
  const onAction = (a: BankAction) => {
    const prev = stateRef.current;
    const next = applyAction(prev, a);
    if (next === prev) return;
    stateRef.current = next;
    setState(next);
    if (next.screen !== prev.screen && markersRef.current.length) setMarkersBoth([]);
    send({ type: "state", state: next });
    if (a.type === "continue") setTimeout(() => onAction({ type: "sms" }), 1100);
  };

  const onStagePointerDown = (ev: ReactPointerEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / scale;
    const y = (ev.clientY - r.top) / scale;
    send({ type: "tap", x, y });
    const hit = markersRef.current.find((m) => !m.done && Math.hypot(m.x - x, m.y - y) < 56);
    if (hit) {
      setMarkersBoth(markersRef.current.map((m) => (m.id === hit.id ? { ...m, done: true } : m)));
      send({ type: "done", id: hit.id });
      buzz([20, 40, 20]);
      if (hit.tool !== "step") {
        setTimeout(() => setMarkersBoth(markersRef.current.filter((m) => m.id !== hit.id)), 1200);
      }
    }
  };

  const endSession = () => {
    send({ type: "end" });
    setEnded({ by: "you", duration: Date.now() - startedAt.current, pointers: received.current });
  };

  const restartGuide = () => {
    stateRef.current = INITIAL_STATE;
    setState(INITIAL_STATE);
    setGuide("running");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(helperUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the link is visible anyway */
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Help me with GetPointr", text: `Join my GetPointr session (code ${room})`, url: helperUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      void copyLink();
    }
  };

  const g = guideFor(state);
  const guideRunning = guide === "running";
  const guideDone = guideRunning && state.screen === "success";

  // ---- Guidance strip text -----------------------------------------------
  let stripFrom = "GetPointr";
  let stripText = `Waiting for your trusted helper. Share code ${room} or tap Invite.`;
  if (peer) {
    stripFrom = `${HELPER_SHORT} · Trusted helper`;
    stripText = caption?.text ?? `${HELPER_SHORT} can see your screen and point — but can never tap or type for you.`;
  } else if (guideRunning) {
    stripFrom = "Guided demo";
    stripText = g.text;
  }

  return (
    <div className="fixed inset-0 flex select-none flex-col overflow-hidden bg-ink-950 text-white" style={{ height: "100dvh" }}>
      {/* Header */}
      <header
        className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-ink-900 px-3"
        style={{ paddingTop: "env(safe-area-inset-top)", minHeight: 52 }}
      >
        <Logo size={24} />
        <StatusPill peer={peer} guide={guideRunning} />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSheet("invite")}
            aria-label="Invite a helper"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/10"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={endSession}
            aria-label="End session"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Guidance strip — lives outside the app so it never covers a button */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 bg-ink-900/70 px-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-semibold ${
            peer ? "bg-volt" : guideRunning ? "bg-laser" : "bg-ink-700"
          }`}
        >
          {peer ? "A" : guideRunning ? <Sparkles className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </span>
        <div key={caption?.id ?? stripText} className="gp-rise min-w-0 flex-1" aria-live="polite">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {stripFrom}
            {peer && shieldOn && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-emerald-300">
                <EyeOff className="h-3 w-3" /> Private info hidden
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-[14px] leading-snug text-slate-100">{stripText}</p>
        </div>
      </div>

      {/* Stage */}
      <main ref={mainRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {size.w > 0 && (
          <div onPointerDownCapture={onStagePointerDown} style={{ touchAction: "manipulation" }}>
            <Stage height={H} scale={scale} innerRef={stageRef} framed={!fill}>
              <MockBankApp state={state} onAction={onAction} />
              <MarkerLayer markers={markers} trail={trail} />
              {guideRunning && g.target && (
                <GuideMarker key={`${state.screen}-${g.target}`} target={g.target} stageRef={stageRef} scale={scale} />
              )}
            </Stage>
          </div>
        )}
      </main>

      {verifying && <TrustOverlay />}

      {guide === "offer" && !peer && (
        <Sheet onClose={() => setGuide("idle")}>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-laser">
            <Sparkles className="h-4 w-4" /> No helper yet
          </div>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight">Try the 60-second guided demo</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-slate-300">
            You&apos;ll see exactly what a real helper sends: glowing pointers that show you where to tap. You stay in
            control the whole time.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setGuide("running")}
              className="h-12 cursor-pointer rounded-xl bg-laser text-[15px] font-semibold text-white transition-colors hover:bg-orange-500"
            >
              Start guided demo ({Math.max(countdown, 0)})
            </button>
            <button
              type="button"
              onClick={() => {
                setGuide("idle");
                setSheet("invite");
              }}
              className="h-12 cursor-pointer rounded-xl bg-white/10 text-[15px] font-semibold text-white transition-colors hover:bg-white/15"
            >
              Invite a real helper instead
            </button>
          </div>
        </Sheet>
      )}

      {guideDone && !peer && (
        <Sheet onClose={() => setGuide("idle")}>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Demo complete
          </div>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight">You did every tap yourself.</h2>
          <ul className="mt-3 space-y-2 text-[14px] text-slate-300">
            <li className="flex gap-2"><Ban className="mt-0.5 h-4 w-4 shrink-0 text-laser" /> Remote inputs accepted: 0</li>
            <li className="flex gap-2"><EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-laser" /> Balance &amp; code hidden from the helper</li>
            <li className="flex gap-2"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-laser" /> Only pre-paired devices can connect</li>
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={restartGuide} className="h-12 cursor-pointer rounded-xl bg-white/10 text-[15px] font-semibold transition-colors hover:bg-white/15">
              Run again
            </button>
            <button
              type="button"
              onClick={() => {
                setGuide("idle");
                setSheet("invite");
              }}
              className="h-12 cursor-pointer rounded-xl bg-laser text-[15px] font-semibold transition-colors hover:bg-orange-500"
            >
              Try a real helper
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "invite" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-volt">
            <Laptop className="h-4 w-4" /> Invite your trusted helper
          </div>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight">Open this link on a laptop</h2>
          <p className="mt-1 text-[14px] text-slate-300">They&apos;ll see your screen and can point — never tap.</p>
          <div className="mt-4 rounded-xl bg-ink-800 p-3 ring-1 ring-white/10">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Session code</div>
            <div className="font-mono text-[28px] font-semibold tracking-[0.3em] text-white">{room}</div>
            <div className="mt-1 break-all font-mono text-[12px] text-slate-400">{helperUrl}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={copyLink} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 text-[15px] font-semibold transition-colors hover:bg-white/15">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" onClick={shareLink} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-volt text-[15px] font-semibold transition-colors hover:bg-violet-500">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          {!guideRunning && !peer && (
            <button type="button" onClick={() => { setSheet(null); setGuide("running"); }} className="mt-3 w-full cursor-pointer text-center text-[13px] font-medium text-slate-400 underline-offset-4 hover:underline">
              No helper handy? Run the guided demo
            </button>
          )}
        </Sheet>
      )}

      {ended && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/95 px-6 text-center backdrop-blur">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-[22px] font-semibold tracking-tight">
            {ended.by === "you" ? "You ended the session" : `${HELPER_SHORT} ended the session`}
          </h2>
          <p className="mt-1 text-[14px] text-slate-400">Session log (metadata only)</p>
          <dl className="mt-4 w-full max-w-xs divide-y divide-white/10 rounded-2xl bg-ink-800 px-4 text-left text-[14px] ring-1 ring-white/10">
            <Row k="Duration" v={formatClock(ended.duration)} />
            <Row k="Helper" v={HELPER_NAME} />
            <Row k="Pointers received" v={String(ended.pointers)} />
            <Row k="Remote taps accepted" v="0" />
            <Row k="Screen data stored" v="None" />
          </dl>
          <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-xl bg-laser px-6 text-[15px] font-semibold transition-colors hover:bg-orange-500">
            Start a new session
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-2.5">
      <dt className="text-slate-400">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function StatusPill({ peer, guide }: { peer: boolean; guide: boolean }) {
  if (peer)
    return (
      <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[12px] font-medium text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" /> {HELPER_SHORT} connected
      </span>
    );
  if (guide)
    return (
      <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-laser/15 px-2.5 py-1 text-[12px] font-medium text-orange-300">
        <Sparkles className="h-3 w-3" /> Guided demo
      </span>
    );
  return (
    <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium text-slate-300">
      <span className="gp-pulse-dot h-2 w-2 rounded-full bg-amber-400" /> Waiting
    </span>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="gp-sheet max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-ink-900 p-5 ring-1 ring-white/10 sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        {children}
      </div>
    </div>
  );
}

function TrustOverlay() {
  const rows = [
    { icon: KeyRound, text: "Device key found in secure storage", delay: 0.5 },
    { icon: UserCheck, text: `Trusted Circle: ${HELPER_NAME}`, delay: 1.1 },
    { icon: Ban, text: "Unknown callers blocked", delay: 1.7 },
  ];
  return (
    <div className="gp-overlay-out absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-950 px-8">
      <span className="relative grid h-20 w-20 place-items-center">
        <span className="gp-ring absolute inset-0 rounded-full border-2 border-laser" />
        <span className="grid h-16 w-16 place-items-center rounded-full bg-laser/15 text-laser">
          <ShieldCheck className="h-8 w-8" />
        </span>
      </span>
      <h1 className="mt-5 text-[20px] font-semibold tracking-tight">Securing your session</h1>
      <p className="mt-1 text-[14px] text-slate-400">Verifying cryptographic pairing…</p>
      <ul className="mt-6 w-full max-w-xs space-y-3">
        {rows.map(({ icon: Icon, text, delay }) => (
          <li key={text} className="flex items-center gap-3 text-[14px] text-slate-200">
            <Icon className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="flex-1">{text}</span>
            <span className="gp-check-in grid h-5 w-5 place-items-center rounded-full bg-emerald-500" style={{ animationDelay: `${delay}s` }}>
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
