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
  HelpCircle,
  Lock,
  MessageSquareText,
  MousePointer2,
  Radio,
  RotateCcw,
  ScrollText,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import MockBankApp, { ShieldContext } from "./MockBankApp";
import { Stage, W, FRAME_PAD, IPHONE_CHROME_H } from "./Stage";
import { MarkerLayer, type TapRipple } from "./Markers";
import { Logo } from "./Logo";
import { AppearanceBar } from "@/lib/preferences";
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
  "Tap where I am pointing",
  "Go back one screen",
  "You are doing great!",
  "Never share that code with anyone, including me.",
];

type LogEntry = { id: number; t: number; text: string };

export default function HelperView({ room }: { room: string }) {
  const origin = useOrigin();
  const phoneUrl = origin ? `${origin}/host/${room}` : "";
  const isLocalhost = /localhost|127\.0\.0\.1/.test(origin);

  const [hostState, setHostState] = useState<AppState>(INITIAL_STATE);
  const hostStateRef = useRef(hostState);
  const [hostH, setHostH] = useState(740);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const [tool, setTool] = useState<Tool>("ring");
  const [shield, setShield] = useState(true);
  const shieldRef = useRef(true);
  const [mandatoryShield, setMandatoryShield] = useState(true);
  const mandatoryShieldRef = useRef(true);
  const [hostPrefsOpen, setHostPrefsOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<{ id: string; text: string } | null>(null);

  const [trail, setTrail] = useState<Pt[]>([]);
  const [lastLaserPath, setLastLaserPath] = useState<Pt[]>([]);
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
  const press = useRef<{ x: number; y: number; drag: boolean; last: number; path: Pt[] } | null>(null);
  const [mainRef, size] = useElementSize<HTMLDivElement>();

  const safeHostH = Math.max(700, hostH);
  const scale =
    size.w > 0 && size.h > 0
      ? Math.max(
          0.32,
          Math.min(
            (size.w - 32 - FRAME_PAD * 2) / W,
            (size.h - 88 - FRAME_PAD * 2) / (safeHostH + IPHONE_CHROME_H),
            1.06,
          ),
        )
      : 0.72;

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
      case "prefs-open":
        setHostPrefsOpen(e.open);
        if (e.open) addLog(`${OWNER_NAME} opened session preferences (screen blurred)`);
        break;
      case "mandatory-shield":
        mandatoryShieldRef.current = e.locked;
        setMandatoryShield(e.locked);
        if (e.locked && !shieldRef.current) {
          shieldRef.current = true;
          setShield(true);
          emit({ type: "shield", on: true });
          addLog(`Privacy Shield locked ON by ${OWNER_NAME}`);
        }
        break;
      case "request":
        setActiveRequest({ id: e.id, text: e.text });
        addLog(`Request from ${OWNER_NAME}: “${e.text}”`);
        break;
      case "tap": {
        const id = nanoid(6);
        setTaps((t) => [...t.slice(-5), { id, x: e.x, y: e.y }]);
        setTimeout(() => setTaps((t) => t.filter((r) => r.id !== id)), 1350);
        break;
      }
      case "done": {
        const hit = markersRef.current.find((m) => m.id === e.id);
        if (!hit || hit.done) break;
        addLog(`${OWNER_NAME} tapped the highlighted spot ✓`);
        syncMarkers(
          markersRef.current.map((m) => (m.id === e.id ? { ...m, done: true } : m)),
          emit,
        );
        if (hit.tool !== "step") {
          setTimeout(() => syncMarkers(markersRef.current.filter((m) => m.id !== e.id), emit), 1200);
        }
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
      setHostPrefsOpen(false);
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

  const toLogical = (ev: ReactPointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      x: Math.min(W, Math.max(0, (ev.clientX - r.left) / scale)),
      y: Math.min(safeHostH, Math.max(0, (ev.clientY - r.top) / scale)),
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
    if (hostPrefsOpen) return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const p = toLogical(ev);
    press.current = { ...p, drag: false, last: 0, path: [p] };
  };
  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const pr = press.current;
    if (!pr || hostPrefsOpen) return;
    const p = toLogical(ev);
    if (!pr.drag && Math.hypot(p.x - pr.x, p.y - pr.y) > 8) pr.drag = true;
    if (!pr.drag) return;
    setTrail((t) => [...t.slice(-13), p]);
    const t = performance.now();
    if (t - pr.last > 60) {
      pr.last = t;
      pr.path.push(p);
      send({ type: "laser", x: p.x, y: p.y });
    }
  };
  const onPointerUp = () => {
    const pr = press.current;
    press.current = null;
    if (!pr) return;
    if (pr.drag) {
      const saved = pr.path.slice(-40);
      setLastLaserPath(saved);
      send({ type: "laser-end", path: saved });
      addLog(`Live laser gesture sent (${saved.length} points)`);
      setTimeout(() => setTrail([]), 900);
    } else {
      placeMarker(pr.x, pr.y);
    }
  };

  const replayLaser = () => {
    if (!lastLaserPath.length || !peer) return;
    setTrail([]);
    lastLaserPath.forEach((pt, idx) => {
      setTimeout(() => {
        setTrail((prev) => [...prev.slice(-13), pt]);
        send({ type: "laser", x: pt.x, y: pt.y });
        if (idx === lastLaserPath.length - 1) {
          send({ type: "laser-end", path: lastLaserPath });
          setTimeout(() => setTrail([]), 1000);
        }
      }, idx * 70);
    });
    addLog("Replayed last laser gesture");
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
    if (mandatoryShieldRef.current) return;
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

  const keyActions = useRef({ undo, clear, toggleShield, replayLaser });
  useEffect(() => {
    keyActions.current = { undo, clear, toggleShield, replayLaser };
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
      else if (k === "r") keyActions.current.replayLaser();
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
  const effectiveShield = mandatoryShield || shield;

  return (
    <div className="flex min-h-dvh flex-col bg-gp-bg text-gp-text lg:h-dvh">
      {/* Top bar */}
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-gp-border bg-gp-surface px-4 py-2 sm:px-5">
        <Link href="/" aria-label="GetPointr home">
          <Logo size={28} />
        </Link>
        <span className="hidden rounded-full border border-gp-border bg-gp-card px-2.5 py-1 font-mono text-[12px] font-bold tracking-widest text-gp-sub sm:inline">
          {room}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${
            peer
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
              : "border border-gp-border bg-gp-card text-gp-sub"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${peer ? "bg-emerald-500" : "gp-pulse-dot bg-amber-500"}`} />
          {peer ? "Phone connected" : status === "error" ? "Connection error" : "Waiting for phone"}
        </span>
        <div className="ml-auto flex items-center gap-2.5">
          <AppearanceBar compact />
          {peer && (
            <span className="hidden font-mono text-[13px] font-semibold text-gp-muted sm:inline">
              {formatClock(elapsed)}
            </span>
          )}
          <button
            type="button"
            onClick={endSession}
            className="h-9 cursor-pointer rounded-lg border border-gp-border bg-gp-card px-3 text-[13px] font-bold text-gp-text transition-colors hover:border-rose-500 hover:bg-rose-500 hover:text-white"
          >
            End session
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Mirror */}
        <main ref={mainRef} className="relative flex min-h-[480px] flex-1 flex-col items-center justify-center p-4 sm:min-h-[580px] sm:p-6 lg:min-h-0">
          {peer ? (
            <>
              {/* Incoming Help Request Banner from Phone Owner */}
              {activeRequest && (
                <div
                  key={activeRequest.id}
                  className="gp-drop mb-3 flex w-full max-w-md items-center gap-3 rounded-2xl border border-volt bg-volt/15 px-4 py-2.5 shadow-lg"
                >
                  <HelpCircle className="h-5 w-5 shrink-0 text-volt" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-volt">
                      Request from {OWNER_NAME}
                    </div>
                    <p className="truncate text-[0.9rem] font-bold text-gp-text">“{activeRequest.text}”</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRequest(null)}
                    aria-label="Dismiss request"
                    className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-gp-sub hover:bg-gp-hover hover:text-gp-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[0.86rem] font-semibold text-gp-sub">
                <Eye className="h-4 w-4 text-laser" />
                Live view of {OWNER_NAME}&apos;s phone ·{" "}
                <span className="font-bold text-gp-text">{SCREEN_LABEL[hostState.screen]}</span>
                <span className="rounded-full border border-gp-border bg-gp-card px-2.5 py-0.5 text-[11px] font-bold">
                  View-only (point, never tap)
                </span>
              </div>
              <Stage height={safeHostH} scale={scale} innerRef={stageRef} framed>
                <ShieldContext.Provider value={effectiveShield}>
                  <MockBankApp state={hostState} />
                </ShieldContext.Provider>
                <MarkerLayer markers={markers} trail={trail} taps={taps} />

                {/* Automatic blur veil when phone owner has Session Preferences open */}
                {hostPrefsOpen && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/75 px-8 text-center text-white backdrop-blur-xl">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-laser/20 text-laser ring-1 ring-white/20">
                      <SlidersHorizontal className="h-7 w-7" />
                    </span>
                    <h3 className="mt-4 text-[18px] font-extrabold tracking-tight">
                      {OWNER_NAME} is setting session preferences
                    </h3>
                    <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-slate-200">
                      Screen is automatically blurred while {OWNER_NAME} selects privacy and accessibility options.
                    </p>
                  </div>
                )}

                <div
                  className={`absolute inset-0 z-40 ${hostPrefsOpen ? "cursor-not-allowed" : "cursor-crosshair"}`}
                  style={{ touchAction: "none" }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  aria-label="Click to point, drag for a live laser"
                />
              </Stage>
              <p className="mt-3 text-center text-[0.8rem] font-medium text-gp-muted">
                Click to place a pointer · drag for a live laser · bright blue ripples show where {OWNER_NAME} taps
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
        <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-gp-border bg-gp-surface/75 p-4 sm:p-5 lg:w-[376px] lg:border-l lg:border-t-0">
          <Card>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${peer ? "text-emerald-500" : "text-gp-muted"}`} />
              <h2 className="text-[0.92rem] font-bold text-gp-text">
                {peer ? "Trusted Circle verified" : "Awaiting paired device"}
              </h2>
            </div>
            <div className="mt-2 font-mono text-[11px] font-semibold tracking-wide text-gp-muted">
              Pairing fingerprint {fp || "..."}
            </div>
            <ul className="mt-3 space-y-1.5 text-[0.84rem] font-medium text-gp-sub">
              <li className="flex items-center gap-2">
                <Ban className="h-4 w-4 shrink-0 text-laser" /> Remote taps disabled (visual pointers only)
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4 shrink-0 text-laser" /> Screen data stored: none
              </li>
              <li className="flex items-center gap-2">
                <Radio className="h-4 w-4 shrink-0 text-laser" />
                {mode === "supabase" ? "Realtime: encrypted (TLS) · metadata only" : "Local demo channel (same browser)"}
              </li>
            </ul>
          </Card>

          <Card>
            <SectionTitle>Pointer tools</SectionTitle>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pointer tool">
              {TOOLS.map(({ id, label, icon: Icon, key }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={tool === id}
                  onClick={() => setTool(id)}
                  className={`relative flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border text-[12px] font-bold transition-colors ${
                    tool === id
                      ? "border-laser bg-laser/15 text-gp-text"
                      : "border-gp-border bg-gp-elevated text-gp-sub hover:bg-gp-hover"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                  <kbd className="absolute right-1.5 top-1 font-mono text-[10px] font-semibold text-gp-muted">{key}</kbd>
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <SmallBtn onClick={undo} icon={Undo2} label="Undo" kbd="Z" />
              <SmallBtn onClick={clear} icon={Trash2} label="Clear" kbd="C" />
              <SmallBtn
                onClick={replayLaser}
                icon={RotateCcw}
                label="Replay"
                kbd="R"
                disabled={!lastLaserPath.length || !peer}
              />
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
                  className="cursor-pointer rounded-full border border-gp-border bg-gp-elevated px-3 py-1.5 text-left text-[12px] font-semibold text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="mt-2.5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                say(msg);
                setMsg("");
              }}
            >
              <label htmlFor="say" className="sr-only">
                Message to phone
              </label>
              <input
                id="say"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                maxLength={140}
                placeholder="Type a short instruction..."
                className="h-10 min-w-0 flex-1 rounded-lg border border-gp-border bg-gp-bg px-3 text-[14px] font-medium text-gp-text placeholder:text-gp-muted focus:outline-none focus:ring-2 focus:ring-laser"
              />
              <button
                type="submit"
                disabled={!peer || !msg.trim()}
                aria-label="Send message"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-volt text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[0.92rem] font-bold text-gp-text">
                  {effectiveShield ? (
                    <EyeOff className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-amber-500" />
                  )}
                  Privacy Shield
                  {!mandatoryShield && <kbd className="font-mono text-[10px] text-gp-muted">S</kbd>}
                </div>
                {mandatoryShield ? (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Lock className="h-3.5 w-3.5 shrink-0" /> Locked ON by {OWNER_NAME} (Mandatory)
                  </p>
                ) : null}
                <p className="mt-1 text-[12px] font-medium leading-relaxed text-gp-sub">
                  Balances, account numbers, passwords, preferences, and 2FA codes stay masked on your screen.
                  {mandatoryShield
                    ? ` ${OWNER_NAME} enabled Mandatory Privacy Shield for this session.`
                    : " Toggle off only to show judges the difference."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={effectiveShield}
                aria-label="Privacy Shield"
                disabled={mandatoryShield}
                onClick={toggleShield}
                title={mandatoryShield ? `Locked ON by ${OWNER_NAME}` : "Toggle Privacy Shield"}
                className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
                  effectiveShield ? "bg-emerald-500" : "bg-slate-400"
                } ${mandatoryShield ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
              >
                <span
                  className={`absolute left-0 top-0.5 grid h-6 w-6 place-items-center rounded-full bg-white text-emerald-700 shadow transition-transform duration-200 ${
                    effectiveShield ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                >
                  {mandatoryShield ? <Lock className="h-3 w-3" /> : null}
                </span>
              </button>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={ScrollText}>Session log · metadata only</SectionTitle>
            <ol className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1 text-[12px]">
              {log.length === 0 && (
                <li className="font-medium text-gp-muted">
                  Events will appear here. No screen content is ever recorded.
                </li>
              )}
              {log.map((l) => (
                <li key={l.id} className="flex gap-2">
                  <span className="shrink-0 font-mono font-semibold text-gp-muted">
                    {new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="font-medium text-gp-sub">{l.text}</span>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      {ended && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur"
          style={{ background: "var(--gp-backdrop)" }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-gp-border bg-gp-surface p-6 text-center shadow-2xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-[1.25rem] font-extrabold text-gp-text">
              {ended === "you" ? "Session ended" : `${OWNER_NAME} ended the session`}
            </h2>
            <p className="mt-1 text-[0.9rem] font-medium text-gp-sub">
              You never had control of the device. Nothing from the screen was stored.
            </p>
            <div className="mt-5 grid gap-2">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-laser text-[14px] font-bold text-white transition-colors hover:bg-orange-600"
              >
                Start a new session
              </Link>
              <button
                type="button"
                onClick={() => setEnded(null)}
                className="h-11 cursor-pointer rounded-xl border border-gp-border bg-gp-elevated text-[14px] font-bold text-gp-text transition-colors hover:bg-gp-hover"
              >
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
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-laser/10">
        {phoneUrl ? (
          <QRCodeSVG value={phoneUrl} size={232} level="M" marginSize={0} fgColor="#0B1120" />
        ) : (
          <div className="h-[232px] w-[232px] animate-pulse rounded-xl bg-slate-200" />
        )}
      </div>
      <div className="flex-1 text-center md:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-laser/15 px-3 py-1 text-[12px] font-bold text-laser">
          <Smartphone className="h-3.5 w-3.5" />{" "}
          {reconnecting ? "Phone disconnected: waiting to reconnect" : "Step 1 of 2"}
        </div>
        <h1 className="mt-3 text-[1.9rem] font-extrabold leading-tight tracking-tight text-gp-text">
          Scan with the phone you want to help
        </h1>
        <ol className="mt-4 space-y-2 text-[0.96rem] font-medium text-gp-sub">
          <li>1. Open the phone camera and point it at the QR code.</li>
          <li>2. The phone verifies your Trusted Circle pairing and preferences.</li>
          <li>3. You will see its screen here and can point, never tap.</li>
        </ol>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <a
            href={phoneUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-laser px-5 text-[0.96rem] font-extrabold text-white shadow-lg shadow-laser/30 transition-colors hover:bg-orange-600"
          >
            Open phone view in a new tab <ArrowUpRight className="h-5 w-5 stroke-[2.6]" />
          </a>

          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-gp-border bg-gp-card px-4 text-[0.92rem] font-bold text-gp-text transition-colors hover:bg-gp-hover"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy phone link"}
          </button>

          <div className="rounded-xl border border-gp-border bg-gp-card px-4 py-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gp-muted">Session code</div>
            <div className="font-mono text-[20px] font-bold tracking-[0.28em] text-gp-text">{room}</div>
          </div>
        </div>

        {(isLocalhost || mode === "local") && (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] font-medium leading-relaxed text-gp-sub">
            {mode === "local"
              ? "Realtime is running in local browser mode right now. Click “Open phone view in a new tab” above to test side by side."
              : "You are on localhost, which a separate phone cannot reach yet. Use the deployed Vercel URL for cross-device phone testing."}
          </p>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-gp-border bg-gp-card p-4 shadow-xs">{children}</section>;
}

function SectionTitle({
  children,
  icon: Icon = MessageSquareText,
}: {
  children: React.ReactNode;
  icon?: typeof Circle;
}) {
  return (
    <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gp-muted">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h2>
  );
}

function SmallBtn({
  onClick,
  icon: Icon,
  label,
  kbd,
  disabled,
}: {
  onClick: () => void;
  icon: typeof Circle;
  label: string;
  kbd: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gp-border bg-gp-elevated px-2 text-[12px] font-bold text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon className="h-3.5 w-3.5" /> {label} <kbd className="font-mono text-[10px] text-gp-muted">{kbd}</kbd>
    </button>
  );
}
