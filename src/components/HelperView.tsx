"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  Ban,
  Check,
  Circle,
  Copy,
  Database,
  Eye,
  EyeOff,
  Hash,
  MessageSquareText,
  MousePointer2,
  Radio,
  ScrollText,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  Undo2,
} from "lucide-react";
import MockBankApp, { ShieldContext } from "./MockBankApp";
import { Stage, W, FRAME_PAD, IPHONE_CHROME_H } from "./Stage";
import { MarkerLayer, type TapRipple } from "./Markers";
import { Logo } from "./Logo";
import { useRoom, type SendFn } from "@/lib/room";
import { fingerprint } from "@/lib/ids";
import { formatClock, useElementSize, useOrigin } from "@/lib/hooks";
import {
  INITIAL_STATE,
  OWNER_NAME,
  SCREEN_LABEL,
  type AppState,
  type Marker,
  type Pt,
  type RoomEvent,
  type Tool,
} from "@/lib/types";

const TOOLS: { id: Tool; label: string; icon: typeof Circle; key: string }[] = [
  { id: "ring", label: "Ring", icon: Circle, key: "1" },
  { id: "arrow", label: "Arrow", icon: MousePointer2, key: "2" },
  { id: "step", label: "Steps", icon: Hash, key: "3" },
];

const QUICK = [
  "Tap where I'm pointing",
  "Go back one screen",
  "You're doing great!",
  "Never share that code with anyone — including me.",
];

type LogEntry = { id: number; t: number; text: string };

export default function HelperView({ room }: { room: string }) {
  const origin = useOrigin();
  const phoneUrl = origin ? `${origin}/host/${room}` : "";
  const isLocalhost = /localhost|127\.0\.0\.1/.test(origin);

  const [hostState, setHostState] = useState<AppState>(INITIAL_STATE);
  const hostStateRef = useRef(hostState);
  const [hostH, setHostH] = useState(760);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const [tool, setTool] = useState<Tool>("ring");
  const [shield, setShield] = useState(true);
  const shieldRef = useRef(true);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [taps, setTaps] = useState<TapRipple[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useRef(0);
  const [msg, setMsg] = useState("");
  const [fp, setFp] = useState("");
  const [connectedAt, setConnectedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [ended, setEnded] = useState<null | "you" | "phone">(null);
  const [copied, setCopied] = useState(false);
  const [everConnected, setEverConnected] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; drag: boolean; last: number } | null>(null);
  const [mainRef, size] = useElementSize<HTMLDivElement>();

  const scale =
    size.w > 0
      ? Math.max(
          0.3,
          Math.min((size.w - 48 - FRAME_PAD * 2) / W, (size.h - 96 - FRAME_PAD * 2) / (hostH + IPHONE_CHROME_H), 1.1),
        )
      : 1;

  const addLog = (text: string) => {
    logId.current += 1;
    const entry = { id: logId.current, t: Date.now(), text };
    setLog((l) => [entry, ...l].slice(0, 60));
  };

  const syncMarkers = (m: Marker[], emit: SendFn) => {
    markersRef.current = m;
    setMarkers(m);
    emit({ type: "markers", markers: m });
  };

  const handleEvent = (e: RoomEvent, emit: SendFn) => {
    switch (e.type) {
      case "state": {
        const prev = hostStateRef.current;
        if (e.state.screen !== prev.screen) {
          addLog(`${OWNER_NAME} opened “${SCREEN_LABEL[e.state.screen]}”`);
          if (markersRef.current.length) syncMarkers([], emit);
        }
        hostStateRef.current = e.state;
        setHostState(e.state);
        break;
      }
      case "viewport":
        setHostH(e.h);
        break;
      case "tap": {
        const id = nanoid(6);
        setTaps((t) => [...t.slice(-4), { id, x: e.x, y: e.y }]);
        setTimeout(() => setTaps((t) => t.filter((r) => r.id !== id)), 900);
        break;
      }
      case "done": {
        const hit = markersRef.current.find((m) => m.id === e.id);
        if (!hit || hit.done) break;
        addLog(`${OWNER_NAME} tapped the highlighted spot ✓`);
        syncMarkers(markersRef.current.map((m) => (m.id === e.id ? { ...m, done: true } : m)), emit);
        if (hit.tool !== "step") setTimeout(() => syncMarkers(markersRef.current.filter((m) => m.id !== e.id), emit), 1200);
        break;
      }
      case "sync":
        emit({ type: "markers", markers: markersRef.current });
        emit({ type: "shield", on: shieldRef.current });
        break;
      case "end":
        setEnded("phone");
        addLog(`${OWNER_NAME} ended the session`);
        break;
    }
  };

  const handlePeer = (present: boolean, emit: SendFn) => {
    if (present) {
      setConnectedAt(Date.now());
      setEverConnected(true);
      setEnded(null);
      addLog("Phone connected · Trusted Circle pairing verified");
      emit({ type: "markers", markers: markersRef.current });
      emit({ type: "shield", on: shieldRef.current });
      emit({ type: "sync" });
    } else {
      addLog("Phone disconnected");
    }
  };

  const { send, peer, status, mode } = useRoom(room, "helper", handleEvent, handlePeer);
  const commitMarkers = (m: Marker[]) => syncMarkers(m, send);

  useEffect(() => {
    let alive = true;
    void fingerprint(room).then((f) => alive && setFp(f));
    return () => {
      alive = false;
    };
  }, [room]);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // ---- Pointer input on the mirrored screen ------------------------------
  const toLogical = (ev: ReactPointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      x: Math.min(W, Math.max(0, (ev.clientX - r.left) / scale)),
      y: Math.min(hostH, Math.max(0, (ev.clientY - r.top) / scale)),
    };
  };

  const placeMarker = (x: number, y: number) => {
    const cur = markersRef.current;
    let next: Marker[];
    if (tool === "step") {
      const n = cur.filter((m) => m.tool === "step").length + 1;
      next = [...cur, { id: nanoid(8), x, y, tool, step: n }];
      addLog(`Step ${n} placed on “${SCREEN_LABEL[hostStateRef.current.screen]}”`);
    } else {
      next = [...cur.filter((m) => m.tool === "step"), { id: nanoid(8), x, y, tool }];
      addLog(`${tool === "ring" ? "Ring" : "Arrow"} placed on “${SCREEN_LABEL[hostStateRef.current.screen]}”`);
    }
    commitMarkers(next);
  };

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const p = toLogical(ev);
    press.current = { ...p, drag: false, last: 0 };
  };
  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const pr = press.current;
    if (!pr) return;
    const p = toLogical(ev);
    if (!pr.drag && Math.hypot(p.x - pr.x, p.y - pr.y) > 8) pr.drag = true;
    if (!pr.drag) return;
    setTrail((t) => [...t.slice(-9), p]);
    const t = performance.now();
    if (t - pr.last > 45) {
      pr.last = t;
      send({ type: "laser", x: p.x, y: p.y });
    }
  };
  const onPointerUp = () => {
    const pr = press.current;
    press.current = null;
    if (!pr) return;
    if (pr.drag) {
      send({ type: "laser-end" });
      setTimeout(() => setTrail([]), 250);
    } else {
      placeMarker(pr.x, pr.y);
    }
  };

  const undo = () => {
    if (!markersRef.current.length) return;
    commitMarkers(markersRef.current.slice(0, -1));
    addLog("Undid last pointer");
  };
  const clear = () => {
    if (!markersRef.current.length) return;
    commitMarkers([]);
    addLog("Cleared all pointers");
  };
  const toggleShield = () => {
    const next = !shieldRef.current;
    shieldRef.current = next;
    setShield(next);
    send({ type: "shield", on: next });
    addLog(next ? "Privacy Shield turned on" : "Privacy Shield turned off (demo only)");
  };
  const say = (text: string) => {
    const t = text.trim();
    if (!t) return;
    send({ type: "say", id: nanoid(6), text: t });
    addLog(`Said: “${t}”`);
  };
  const endSession = () => {
    send({ type: "end" });
    setEnded("you");
    addLog("You ended the session");
  };

  // Keyboard shortcuts (latest handlers via ref)
  const keyActions = useRef({ undo, clear, toggleShield });
  useEffect(() => {
    keyActions.current = { undo, clear, toggleShield };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea") || e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (k === "1") setTool("ring");
      else if (k === "2") setTool("arrow");
      else if (k === "3") setTool("step");
      else if (k === "z") keyActions.current.undo();
      else if (k === "c") keyActions.current.clear();
      else if (k === "s") keyActions.current.toggleShield();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const copyPhoneLink = async () => {
    try {
      await navigator.clipboard.writeText(phoneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const elapsed = peer && connectedAt && now ? now - connectedAt : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 text-white lg:h-dvh">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-ink-900 px-4 sm:px-5">
        <Link href="/" aria-label="GetPointr home">
          <Logo size={26} />
        </Link>
        <span className="hidden rounded-full bg-white/5 px-2.5 py-1 font-mono text-[12px] tracking-widest text-slate-300 ring-1 ring-white/10 sm:inline">
          {room}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
            peer ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-slate-300"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${peer ? "bg-emerald-400" : "gp-pulse-dot bg-amber-400"}`} />
          {peer ? "Phone connected" : status === "error" ? "Connection error" : "Waiting for phone"}
        </span>
        <div className="ml-auto flex items-center gap-3">
          {peer && <span className="hidden font-mono text-[13px] text-slate-400 sm:inline">{formatClock(elapsed)}</span>}
          <button
            type="button"
            onClick={endSession}
            className="h-9 cursor-pointer rounded-lg bg-white/10 px-3 text-[13px] font-semibold transition-colors hover:bg-rose-500/80"
          >
            End session
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Mirror */}
        <main ref={mainRef} className="relative flex min-h-[620px] flex-1 flex-col items-center justify-center p-6 lg:min-h-0">
          {peer ? (
            <>
              <div className="mb-3 flex items-center gap-2 text-[13px] text-slate-400">
                <Eye className="h-4 w-4" />
                Live view of {OWNER_NAME}&apos;s phone · <span className="text-slate-200">{SCREEN_LABEL[hostState.screen]}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] ring-1 ring-white/10">view only</span>
              </div>
              <Stage height={hostH} scale={scale} innerRef={stageRef} framed>
                <ShieldContext.Provider value={shield}>
                  <MockBankApp state={hostState} />
                </ShieldContext.Provider>
                <MarkerLayer markers={markers} trail={trail} taps={taps} />
                <div
                  className="absolute inset-0 z-40 cursor-crosshair"
                  style={{ touchAction: "none" }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  aria-label="Click to point, drag for a live laser"
                />
              </Stage>
              <p className="mt-3 text-[12px] text-slate-500">
                Click to drop a pointer · drag for a live laser · blue ripples show where {OWNER_NAME} taps
              </p>
            </>
          ) : (
            <WaitingPanel
              room={room}
              phoneUrl={phoneUrl}
              isLocalhost={isLocalhost}
              mode={mode}
              reconnecting={everConnected}
              copied={copied}
              onCopy={copyPhoneLink}
            />
          )}
        </main>

        {/* Control panel */}
        <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-white/10 bg-ink-900/60 p-4 sm:p-5 lg:w-[360px] lg:border-l lg:border-t-0">
          <Card>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${peer ? "text-emerald-400" : "text-slate-500"}`} />
              <h2 className="text-[14px] font-semibold">{peer ? "Trusted Circle verified" : "Awaiting paired device"}</h2>
            </div>
            <div className="mt-2 font-mono text-[11px] tracking-wide text-slate-400">Pairing fingerprint {fp || "…"}</div>
            <ul className="mt-3 space-y-1.5 text-[13px] text-slate-300">
              <li className="flex items-center gap-2"><Ban className="h-4 w-4 text-laser" /> Remote control: disabled by design</li>
              <li className="flex items-center gap-2"><Database className="h-4 w-4 text-laser" /> Screen data stored: none</li>
              <li className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-laser" />
                {mode === "supabase" ? "Realtime: encrypted (TLS) · metadata only" : "Local demo channel (same browser)"}
              </li>
            </ul>
          </Card>

          <Card>
            <SectionTitle>Pointer</SectionTitle>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pointer tool">
              {TOOLS.map(({ id, label, icon: Icon, key }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={tool === id}
                  onClick={() => setTool(id)}
                  className={`relative flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[12px] font-semibold ring-1 transition-colors ${
                    tool === id ? "bg-laser/15 text-orange-200 ring-laser" : "bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                  <kbd className="absolute right-1.5 top-1 font-mono text-[10px] text-slate-500">{key}</kbd>
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SmallBtn onClick={undo} icon={Undo2} label="Undo" kbd="Z" />
              <SmallBtn onClick={clear} icon={Trash2} label="Clear" kbd="C" />
            </div>
          </Card>

          <Card>
            <SectionTitle>Say something</SectionTitle>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => say(q)}
                  disabled={!peer}
                  className="cursor-pointer rounded-full bg-white/5 px-3 py-1.5 text-left text-[12px] text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                say(msg);
                setMsg("");
              }}
            >
              <label htmlFor="say" className="sr-only">Message to phone</label>
              <input
                id="say"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                maxLength={140}
                placeholder="Type a short instruction…"
                className="h-10 min-w-0 flex-1 rounded-lg bg-ink-950 px-3 text-[14px] text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-laser"
              />
              <button
                type="submit"
                disabled={!peer || !msg.trim()}
                aria-label="Send message"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-volt transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[14px] font-semibold">
                  {shield ? <EyeOff className="h-4 w-4 text-emerald-400" /> : <Eye className="h-4 w-4 text-amber-400" />}
                  Privacy Shield
                  <kbd className="font-mono text-[10px] text-slate-500">S</kbd>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                  Balances, account numbers, passwords and 2FA codes are masked on the phone before anything is
                  shared. Toggle off only to show judges the difference.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={shield}
                aria-label="Privacy Shield"
                onClick={toggleShield}
                className={`relative mt-0.5 h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${shield ? "bg-emerald-500" : "bg-white/20"}`}
              >
                <span className={`absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${shield ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={ScrollText}>Session log · metadata only</SectionTitle>
            <ol className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1 text-[12px]">
              {log.length === 0 && <li className="text-slate-500">Events will appear here. No screen content is ever recorded.</li>}
              {log.map((l) => (
                <li key={l.id} className="flex gap-2">
                  <span className="shrink-0 font-mono text-slate-500">
                    {new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="text-slate-300">{l.text}</span>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      {ended && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-6 backdrop-blur">
          <div className="w-full max-w-sm rounded-3xl bg-ink-900 p-6 text-center ring-1 ring-white/10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-[20px] font-semibold">
              {ended === "you" ? "Session ended" : `${OWNER_NAME} ended the session`}
            </h2>
            <p className="mt-1 text-[14px] text-slate-400">
              You never had control of the device. Nothing from the screen was stored.
            </p>
            <div className="mt-5 grid gap-2">
              <Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-laser text-[14px] font-semibold transition-colors hover:bg-orange-500">
                Start a new session
              </Link>
              <button type="button" onClick={() => setEnded(null)} className="h-11 cursor-pointer rounded-xl bg-white/10 text-[14px] font-semibold transition-colors hover:bg-white/15">
                Back to console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WaitingPanel({
  room,
  phoneUrl,
  isLocalhost,
  mode,
  reconnecting,
  copied,
  onCopy,
}: {
  room: string;
  phoneUrl: string;
  isLocalhost: boolean;
  mode: "supabase" | "local";
  reconnecting: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-8 md:flex-row md:items-center">
      <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-laser/10">
        {phoneUrl ? (
          <QRCodeSVG value={phoneUrl} size={232} level="M" marginSize={0} fgColor="#0B1120" />
        ) : (
          <div className="h-[232px] w-[232px] animate-pulse rounded-xl bg-slate-200" />
        )}
      </div>
      <div className="flex-1 text-center md:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-laser/15 px-3 py-1 text-[12px] font-semibold text-orange-300">
          <Smartphone className="h-3.5 w-3.5" /> {reconnecting ? "Phone disconnected — waiting to reconnect" : "Step 1 of 2"}
        </div>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight">Scan with the phone you want to help</h1>
        <ol className="mt-4 space-y-2 text-[15px] text-slate-300">
          <li>1. Open the phone&apos;s camera and point it at the code.</li>
          <li>2. The phone verifies your Trusted Circle pairing.</li>
          <li>3. You&apos;ll see its screen here — and can point, never tap.</li>
        </ol>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <div className="rounded-xl bg-ink-800 px-4 py-2 ring-1 ring-white/10">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Or enter code</div>
            <div className="font-mono text-[22px] font-semibold tracking-[0.3em]">{room}</div>
          </div>
          <button type="button" onClick={onCopy} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 text-[14px] font-semibold transition-colors hover:bg-white/15">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy phone link"}
          </button>
          <a
            href={phoneUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-[14px] font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Open phone view in a new tab <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        {(isLocalhost || mode === "local") && (
          <p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-[12px] leading-relaxed text-amber-200 ring-1 ring-amber-500/20">
            {mode === "local"
              ? "Realtime isn't configured yet, so only tabs in this browser can connect. Use “Open phone view in a new tab” to test."
              : "You're on localhost — a phone can't reach this address. Use the deployed URL for phone testing."}
          </p>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-ink-800/80 p-4 ring-1 ring-white/10">{children}</section>;
}

function SectionTitle({ children, icon: Icon = MessageSquareText }: { children: React.ReactNode; icon?: typeof Circle }) {
  return (
    <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h2>
  );
}

function SmallBtn({ onClick, icon: Icon, label, kbd }: { onClick: () => void; icon: typeof Circle; label: string; kbd: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/5 text-[13px] font-medium text-slate-200 ring-1 ring-white/10 transition-colors hover:bg-white/10"
    >
      <Icon className="h-4 w-4" /> {label} <kbd className="font-mono text-[10px] text-slate-500">{kbd}</kbd>
    </button>
  );
}
