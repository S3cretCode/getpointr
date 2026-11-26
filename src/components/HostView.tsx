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
  Lock,
  Moon,
  RotateCcw,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
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
import { usePreferences, type TextScale } from "@/lib/preferences";
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

type ReplayAction =
  | { kind: "laser"; path: Pt[] }
  | { kind: "markers"; markers: Marker[] };

function guideFor(s: AppState): { target: string | null; text: string } {
  switch (s.screen) {
    case "home":
      return { target: "send", text: "Hi Margaret! Let's send $50 to Mom. Tap “Send money” where the ring is pulsing." };
    case "transfer":
      if (!s.payee) return { target: "payee-mom", text: "Now choose who you are paying: tap Mom." };
      if (!s.amount) return { target: "amt-50", text: "Pick the amount: tap $50." };
      return { target: "continue", text: "Looks right. Tap Continue." };
    case "confirm":
      if (!s.smsShown) return { target: null, text: "Hang on, your bank is texting you a verification code..." };
      return {
        target: "confirm",
        text: "A code arrived. Your helper sees it blurred and should never ask for it. Tap “Confirm & send”.",
      };
    case "success":
      return { target: null, text: "All done! You made every tap yourself. The helper never controlled your phone." };
    case "settings":
      return { target: "tab-home", text: "Let's head back: tap Home." };
  }
}

function buzz(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive) {
    navigator.vibrate?.(pattern);
  }
}

/** Interpolates extra intermediate steps between distant drag points so playback is smooth and unhurried. */
function smoothLaserPath(raw: Pt[]): Pt[] {
  if (raw.length <= 1) return raw;
  const out: Pt[] = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const a = raw[i - 1];
    const b = raw[i];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.min(4, Math.max(1, Math.round(dist / 22)));
    for (let s = 1; s <= steps; s++) {
      const k = s / steps;
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    }
  }
  return out.slice(-48);
}

const TEXT_OPTS: { id: TextScale; label: string; sample: string }[] = [
  { id: "normal", label: "Standard", sample: "Aa" },
  { id: "large", label: "Large", sample: "Aa+" },
  { id: "xl", label: "Extra Large", sample: "Aa++" },
];

export default function HostView({ room }: { room: string }) {
  const origin = useOrigin();
  const helperUrl = origin ? `${origin}/helper/${room}` : "";
  const { theme, setTheme, textScale, setTextScale } = usePreferences();

  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const stateRef = useRef(state);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [lastReplay, setLastReplay] = useState<ReplayAction | null>(null);
  const [replaying, setReplaying] = useState(false);

  // Queue-based smooth laser playback (~75ms per step so fast helper drags feel calm and easy to follow)
  const laserQueue = useRef<Pt[]>([]);
  const currentGesture = useRef<Pt[]>([]);
  const laserTicker = useRef<ReturnType<typeof setInterval> | null>(null);
  const trailFadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [caption, setCaption] = useState<{ id: string; text: string } | null>(null);
  const captionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [shieldOn, setShieldOn] = useState(true);
  const [mandatoryShield, setMandatoryShield] = useState(true);
  const mandatoryShieldRef = useRef(true);

  const [verifying, setVerifying] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const prefsOpenRef = useRef(false);
  const [prefsCompletedOnce, setPrefsCompletedOnce] = useState(false);

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

  // Full-bleed on phones, framed iPhone on wider screens
  const fill = size.w > 0 && size.w < 640;
  let H = 800;
  let scale = 1;
  if (fill) {
    scale = size.w / W;
    H = Math.max(520, Math.round(size.h / scale));
    if (H * scale > size.h) scale = size.h / H;
  } else if (size.w > 0) {
    scale = Math.min((size.h - 32 - FRAME_PAD * 2) / (H + IPHONE_CHROME_H), (size.w - 32 - FRAME_PAD * 2) / W, 1.04);
  }

  const setMarkersBoth = (m: Marker[]) => {
    markersRef.current = m;
    setMarkers(m);
  };

  const ensureLaserPlayback = () => {
    clearTimeout(trailFadeTimer.current);
    if (laserTicker.current) return;
    laserTicker.current = setInterval(() => {
      const next = laserQueue.current.shift();
      if (!next) {
        if (laserTicker.current) {
          clearInterval(laserTicker.current);
          laserTicker.current = null;
        }
        setReplaying(false);
        trailFadeTimer.current = setTimeout(() => setTrail([]), 1700);
        return;
      }
      setTrail((prev) => [...prev.slice(-13), next]);
    }, 75);
  };

  const enqueueLaserPoint = (pt: Pt) => {
    const prev = currentGesture.current[currentGesture.current.length - 1];
    currentGesture.current.push(pt);
    if (prev) {
      const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
      if (dist > 28) {
        laserQueue.current.push({ x: (prev.x + pt.x) / 2, y: (prev.y + pt.y) / 2 });
      }
    }
    laserQueue.current.push(pt);
    ensureLaserPlayback();
  };

  const playFullPath = (rawPath: Pt[]) => {
    const pts = smoothLaserPath(rawPath);
    if (!pts.length) return;
    if (laserTicker.current) {
      clearInterval(laserTicker.current);
      laserTicker.current = null;
    }
    clearTimeout(trailFadeTimer.current);
    setTrail([]);
    setReplaying(true);
    laserQueue.current = [...pts];
    ensureLaserPlayback();
  };

  const triggerReplay = () => {
    if (!lastReplay) return;
    if (lastReplay.kind === "laser") {
      playFullPath(lastReplay.path);
    } else {
      setReplaying(true);
      setMarkersBoth([]);
      setTimeout(() => {
        setMarkersBoth(lastReplay.markers.map((m) => ({ ...m, done: false })));
        setReplaying(false);
      }, 120);
    }
  };

  const showCaption = (text: string) => {
    const id = Math.random().toString(36).slice(2);
    setCaption({ id, text });
    clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => setCaption(null), 9500);
  };

  const handleEvent = (e: RoomEvent, emit: SendFn) => {
    switch (e.type) {
      case "markers": {
        const known = new Set(markersRef.current.map((m) => m.id));
        const fresh = e.markers.filter((m) => !known.has(m.id));
        if (fresh.length) {
          received.current += fresh.length;
          buzz(35);
          setLastReplay({ kind: "markers", markers: e.markers });
        }
        setMarkersBoth(e.markers);
        break;
      }
      case "laser":
        enqueueLaserPoint({ x: e.x, y: e.y });
        break;
      case "laser-end": {
        const recorded = e.path && e.path.length > 1 ? e.path : [...currentGesture.current];
        if (recorded.length > 1) {
          received.current += 1;
          setLastReplay({ kind: "laser", path: recorded });
        }
        currentGesture.current = [];
        break;
      }
      case "say":
        showCaption(e.text);
        break;
      case "shield":
        setShieldOn(mandatoryShieldRef.current ? true : e.on);
        break;
      case "sync":
        emit({ type: "state", state: stateRef.current });
        emit({ type: "viewport", h: hRef.current });
        emit({ type: "mandatory-shield", locked: mandatoryShieldRef.current });
        emit({ type: "prefs-open", open: prefsOpenRef.current });
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
      emit({ type: "mandatory-shield", locked: mandatoryShieldRef.current });
      emit({ type: "prefs-open", open: prefsOpenRef.current });
      emit({ type: "sync" });
    }
  };

  const { send, peer } = useRoom(room, "host", handleEvent, handlePeer);

  useEffect(() => {
    hRef.current = H;
    if (peer) send({ type: "viewport", h: H });
  }, [H, peer, send]);

  // Step 1: Trusted Circle handshake -> Step 2: Session Preferences popup opens automatically
  useEffect(() => {
    startedAt.current = Date.now();
    const v = setTimeout(() => {
      setVerifying(false);
      prefsOpenRef.current = true;
      setPrefsOpen(true);
      send({ type: "prefs-open", open: true });
    }, 2400);
    return () => {
      clearTimeout(v);
      if (laserTicker.current) clearInterval(laserTicker.current);
    };
  }, [send]);

  // Offer the 60-second guided demo shortly after the user finishes choosing preferences if no helper connected
  useEffect(() => {
    if (!prefsCompletedOnce || prefsOpen || peer) return;
    const o = setTimeout(() => {
      if (!peerRef.current && !prefsOpenRef.current) {
        setCountdown(6);
        setGuide((g) => (g === "idle" ? "offer" : g));
      }
    }, 3200);
    return () => clearTimeout(o);
  }, [prefsCompletedOnce, prefsOpen, peer]);

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

  const openPreferences = () => {
    prefsOpenRef.current = true;
    setPrefsOpen(true);
    send({ type: "prefs-open", open: true });
  };

  const closePreferences = () => {
    prefsOpenRef.current = false;
    setPrefsOpen(false);
    setPrefsCompletedOnce(true);
    send({ type: "prefs-open", open: false });
    send({ type: "mandatory-shield", locked: mandatoryShieldRef.current });
  };

  const toggleMandatoryShield = () => {
    const next = !mandatoryShieldRef.current;
    mandatoryShieldRef.current = next;
    setMandatoryShield(next);
    if (next) setShieldOn(true);
    send({ type: "mandatory-shield", locked: next });
  };

  // Owner actions
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
      /* ignore */
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Help me with GetPointr",
          text: `Join my GetPointr session (code ${room})`,
          url: helperUrl,
        });
      } catch {
        /* cancelled */
      }
    } else {
      void copyLink();
    }
  };

  const g = guideFor(state);
  const guideRunning = guide === "running";
  const guideDone = guideRunning && state.screen === "success";

  let stripFrom = "GetPointr";
  let stripText = `Waiting for your trusted helper. Share code ${room} or tap Invite.`;
  if (peer) {
    stripFrom = `${HELPER_SHORT} · Trusted helper`;
    stripText =
      caption?.text ?? `${HELPER_SHORT} can see your screen and point, and can never tap or type for you.`;
  } else if (guideRunning) {
    stripFrom = "Guided demo";
    stripText = g.text;
  }

  return (
    <div
      className="fixed inset-0 flex select-none flex-col overflow-hidden bg-gp-bg text-gp-text"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <header
        className="flex shrink-0 items-center gap-2 border-b border-gp-border bg-gp-surface px-3"
        style={{ paddingTop: "env(safe-area-inset-top)", minHeight: 54 }}
      >
        <Logo size={26} />
        <StatusPill peer={peer} guide={guideRunning} />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={openPreferences}
            aria-label="Session preferences"
            title="Preferences & Privacy"
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-gp-border bg-gp-card px-2.5 text-[12px] font-bold text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </button>
          <button
            type="button"
            onClick={() => setSheet("invite")}
            aria-label="Invite a helper"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={endSession}
            aria-label="End session"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Guidance strip + Replay button */}
      <div className="flex min-h-[74px] shrink-0 items-center gap-3 border-b border-gp-border bg-gp-surface/85 px-3 py-2">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white ${
            peer ? "bg-volt" : guideRunning ? "bg-laser" : "bg-slate-600"
          }`}
        >
          {peer ? "A" : guideRunning ? <Sparkles className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </span>
        <div key={caption?.id ?? stripText} className="gp-rise min-w-0 flex-1" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold uppercase tracking-wide text-gp-muted">
            {stripFrom}
            {(shieldOn || mandatoryShield) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-emerald-600 dark:text-emerald-300">
                {mandatoryShield ? <Lock className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {mandatoryShield ? "Mandatory Shield ON" : "Private info hidden"}
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-[0.92rem] font-medium leading-snug text-gp-text">{stripText}</p>
        </div>

        {lastReplay && (
          <button
            type="button"
            onClick={triggerReplay}
            disabled={replaying}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-laser px-3 text-[0.82rem] font-bold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-60"
          >
            <RotateCcw className={`h-4 w-4 ${replaying ? "animate-spin" : ""}`} />
            Replay
          </button>
        )}
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

      {/* Default Start-of-Session Preferences Popup (automatically blurs helper mirror while open) */}
      {prefsOpen && !verifying && (
        <Sheet onClose={closePreferences}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[0.76rem] font-bold uppercase tracking-wide text-laser">
              <ShieldCheck className="h-4 w-4" /> Your Session Preferences
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500">
              <EyeOff className="h-3 w-3" /> Blurred on helper screen
            </span>
          </div>
          <h2 className="mt-1.5 text-[1.25rem] font-extrabold tracking-tight text-gp-text">
            Choose comfort &amp; privacy settings
          </h2>
          <p className="mt-1 text-[0.9rem] font-medium leading-relaxed text-gp-sub">
            Your helper cannot see this menu while you adjust your settings.
          </p>

          {/* Mandatory Privacy Shield */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gp-border bg-gp-elevated p-3.5">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Lock className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="text-[0.95rem] font-bold text-gp-text">Mandatory Privacy Shield</div>
              <p className="mt-0.5 text-[0.82rem] font-medium leading-snug text-gp-sub">
                Locks Privacy Shield ON so your helper can never unblur balances, passwords, or verification codes.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={mandatoryShield}
              aria-label="Mandatory Privacy Shield"
              onClick={toggleMandatoryShield}
              className={`relative mt-1 h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                mandatoryShield ? "bg-emerald-500" : "bg-slate-400"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
                  mandatoryShield ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Theme Mode */}
          <div className="mt-4">
            <div className="text-[0.8rem] font-bold uppercase tracking-wider text-gp-muted">Appearance</div>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-[0.9rem] font-bold transition-colors ${
                  theme === "dark"
                    ? "border-laser bg-laser/15 text-gp-text"
                    : "border-gp-border bg-gp-card text-gp-sub hover:bg-gp-hover"
                }`}
              >
                <Moon className="h-4 w-4" /> Dark mode
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-[0.9rem] font-bold transition-colors ${
                  theme === "light"
                    ? "border-laser bg-laser/15 text-gp-text"
                    : "border-gp-border bg-gp-card text-gp-sub hover:bg-gp-hover"
                }`}
              >
                <Sun className="h-4 w-4" /> Light mode
              </button>
            </div>
          </div>

          {/* Text Size */}
          <div className="mt-4">
            <div className="text-[0.8rem] font-bold uppercase tracking-wider text-gp-muted">Text size</div>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {TEXT_OPTS.map((opt) => {
                const active = textScale === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTextScale(opt.id)}
                    className={`flex h-13 cursor-pointer flex-col items-center justify-center rounded-xl border text-[0.82rem] font-bold transition-colors ${
                      active
                        ? "border-laser bg-laser/15 text-gp-text"
                        : "border-gp-border bg-gp-card text-gp-sub hover:bg-gp-hover"
                    }`}
                  >
                    <span>{opt.sample}</span>
                    <span className="text-[0.72rem] font-semibold text-gp-muted">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={closePreferences}
            className="mt-5 h-12 w-full cursor-pointer rounded-xl bg-laser text-[0.98rem] font-bold text-white shadow-md shadow-laser/25 transition-colors hover:bg-orange-600"
          >
            Save &amp; continue to session
          </button>
        </Sheet>
      )}

      {guide === "offer" && !peer && !prefsOpen && (
        <Sheet onClose={() => setGuide("idle")}>
          <div className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-wide text-laser">
            <Sparkles className="h-4 w-4" /> No helper connected yet
          </div>
          <h2 className="mt-1 text-[1.25rem] font-extrabold tracking-tight text-gp-text">
            Try the 60-second guided demo
          </h2>
          <p className="mt-1 text-[0.92rem] font-medium leading-relaxed text-gp-sub">
            You will see exactly what a real helper sends: glowing pointers that show you where to tap. You stay in
            control the whole time.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setGuide("running")}
              className="h-12 cursor-pointer rounded-xl bg-laser text-[0.96rem] font-bold text-white transition-colors hover:bg-orange-600"
            >
              Start guided demo ({Math.max(countdown, 0)})
            </button>
            <button
              type="button"
              onClick={() => {
                setGuide("idle");
                setSheet("invite");
              }}
              className="h-12 cursor-pointer rounded-xl border border-gp-border bg-gp-elevated text-[0.96rem] font-bold text-gp-text transition-colors hover:bg-gp-hover"
            >
              Invite a real helper instead
            </button>
          </div>
        </Sheet>
      )}

      {guideDone && !peer && !prefsOpen && (
        <Sheet onClose={() => setGuide("idle")}>
          <div className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-wide text-emerald-500">
            <ShieldCheck className="h-4 w-4" /> Demo complete
          </div>
          <h2 className="mt-1 text-[1.25rem] font-extrabold tracking-tight text-gp-text">
            You did every tap yourself.
          </h2>
          <ul className="mt-3 space-y-2 text-[0.92rem] font-medium text-gp-sub">
            <li className="flex gap-2">
              <Ban className="mt-0.5 h-4 w-4 shrink-0 text-laser" /> Remote control: Blocked (0 remote taps possible)
            </li>
            <li className="flex gap-2">
              <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-laser" /> Balance &amp; code hidden from the helper
            </li>
            <li className="flex gap-2">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-laser" /> Only pre-paired devices can connect
            </li>
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={restartGuide}
              className="h-12 cursor-pointer rounded-xl border border-gp-border bg-gp-elevated text-[0.95rem] font-bold text-gp-text transition-colors hover:bg-gp-hover"
            >
              Run again
            </button>
            <button
              type="button"
              onClick={() => {
                setGuide("idle");
                setSheet("invite");
              }}
              className="h-12 cursor-pointer rounded-xl bg-laser text-[0.95rem] font-bold text-white transition-colors hover:bg-orange-600"
            >
              Try a real helper
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "invite" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-wide text-volt">
            <Laptop className="h-4 w-4" /> Invite your trusted helper
          </div>
          <h2 className="mt-1 text-[1.25rem] font-extrabold tracking-tight text-gp-text">
            Open this link on a laptop
          </h2>
          <p className="mt-1 text-[0.92rem] font-medium text-gp-sub">
            They will see your screen and can point, never tap.
          </p>
          <div className="mt-4 rounded-xl border border-gp-border bg-gp-elevated p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-gp-muted">Session code</div>
            <div className="font-mono text-[28px] font-bold tracking-[0.3em] text-gp-text">{room}</div>
            <div className="mt-1 break-all font-mono text-[12px] font-medium text-gp-muted">{helperUrl}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gp-border bg-gp-elevated text-[0.95rem] font-bold text-gp-text transition-colors hover:bg-gp-hover"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={shareLink}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-volt text-[0.95rem] font-bold text-white transition-colors hover:bg-violet-600"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          {!guideRunning && !peer && (
            <button
              type="button"
              onClick={() => {
                setSheet(null);
                setGuide("running");
              }}
              className="mt-3 w-full cursor-pointer text-center text-[0.86rem] font-bold text-gp-sub underline-offset-4 hover:underline"
            >
              No helper handy? Run the guided demo
            </button>
          )}
        </Sheet>
      )}

      {ended && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gp-bg/95 px-6 text-center backdrop-blur">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-[1.4rem] font-extrabold tracking-tight text-gp-text">
            {ended.by === "you" ? "You ended the session" : `${HELPER_SHORT} ended the session`}
          </h2>
          <p className="mt-1 text-[0.92rem] font-medium text-gp-muted">Session log (metadata only)</p>
          <dl className="mt-4 w-full max-w-sm divide-y divide-gp-border rounded-2xl border border-gp-border bg-gp-card px-4 text-left text-[0.9rem]">
            <Row k="Duration" v={formatClock(ended.duration)} />
            <Row k="Helper" v={HELPER_NAME} />
            <Row k="Visual pointers received" v={String(ended.pointers)} />
            <Row k="Remote control" v="Blocked (0 remote taps)" />
            <Row k="Screen data stored" v="None" />
          </dl>
          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center rounded-xl bg-laser px-6 text-[0.96rem] font-bold text-white transition-colors hover:bg-orange-600"
          >
            Start a new session
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-2.5">
      <dt className="font-medium text-gp-muted">{k}</dt>
      <dd className="font-bold text-gp-text">{v}</dd>
    </div>
  );
}

function StatusPill({ peer, guide }: { peer: boolean; guide: boolean }) {
  if (peer)
    return (
      <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> {HELPER_SHORT} connected
      </span>
    );
  if (guide)
    return (
      <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-laser/15 px-2.5 py-1 text-[12px] font-bold text-laser">
        <Sparkles className="h-3 w-3" /> Guided demo
      </span>
    );
  return (
    <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-gp-border bg-gp-card px-2.5 py-1 text-[12px] font-bold text-gp-sub">
      <span className="gp-pulse-dot h-2 w-2 rounded-full bg-amber-500" /> Waiting
    </span>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "var(--gp-backdrop)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="gp-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-gp-border bg-gp-surface p-5 shadow-2xl sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gp-border sm:hidden" />
        {children}
      </div>
    </div>
  );
}

function TrustOverlay() {
  const rows = [
    { icon: KeyRound, text: "Device key found in secure storage", delay: 0.45 },
    { icon: UserCheck, text: `Trusted Circle: ${HELPER_NAME}`, delay: 0.95 },
    { icon: Ban, text: "Unknown callers blocked", delay: 1.45 },
  ];
  return (
    <div className="gp-overlay-out absolute inset-0 z-50 flex flex-col items-center justify-center bg-gp-bg px-8 text-gp-text">
      <span className="relative grid h-20 w-20 place-items-center">
        <span className="gp-ring absolute inset-0 rounded-full border-2 border-laser" />
        <span className="grid h-16 w-16 place-items-center rounded-full bg-laser/15 text-laser">
          <ShieldCheck className="h-8 w-8" />
        </span>
      </span>
      <h1 className="mt-5 text-[1.3rem] font-extrabold tracking-tight">Securing your session</h1>
      <p className="mt-1 text-[0.92rem] font-medium text-gp-muted">Verifying cryptographic pairing...</p>
      <ul className="mt-6 w-full max-w-xs space-y-3">
        {rows.map(({ icon: Icon, text, delay }) => (
          <li key={text} className="flex items-center gap-3 text-[0.92rem] font-semibold text-gp-sub">
            <Icon className="h-4 w-4 shrink-0 text-gp-muted" />
            <span className="flex-1">{text}</span>
            <span
              className="gp-check-in grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white"
              style={{ animationDelay: `${delay}s` }}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
