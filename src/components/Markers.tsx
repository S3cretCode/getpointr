"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { Check } from "lucide-react";
import type { Marker, Pt, Tool } from "@/lib/types";

/** The visual for a single pointer, anchored at (0,0) of its parent. */
export function MarkerGlyph({
  tool,
  step,
  done,
  x = 200,
  y = 400,
}: {
  tool: Tool;
  step?: number;
  done?: boolean;
  x?: number;
  y?: number;
}) {
  if (done && tool !== "step") {
    return (
      <div className="relative h-0 w-0">
        <span className="gp-done absolute -left-6 -top-6 grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
          <Check className="h-6 w-6" strokeWidth={3} />
        </span>
      </div>
    );
  }

  if (tool === "step") {
    return (
      <div className="relative h-0 w-0">
        {!done && (
          <span className="gp-ring absolute -left-8 -top-8 h-16 w-16 rounded-full border-[3px] border-laser" />
        )}
        <span
          className={`gp-pop absolute -left-[19px] -top-[19px] grid h-[38px] w-[38px] place-items-center rounded-full text-[17px] font-bold text-white shadow-lg ring-[3px] ring-white ${
            done ? "bg-emerald-500" : "bg-laser"
          }`}
        >
          {done ? <Check className="h-5 w-5" strokeWidth={3} /> : step}
        </span>
      </div>
    );
  }

  const flipX = x < 90 ? -1 : 1;
  const flipY = y < 90 ? -1 : 1;
  return (
    <div className="relative h-0 w-0">
      {[0, 0.58, 1.16].map((d) => (
        <span
          key={d}
          className="gp-ring absolute -left-11 -top-11 h-22 w-22 rounded-full border-[3px] border-laser"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
      <span className="gp-pop gp-glow absolute -left-[7px] -top-[7px] h-3.5 w-3.5 rounded-full bg-laser" />
      {tool === "arrow" && (
        <div
          className="absolute left-0 top-0"
          style={{ transform: `scale(${flipX}, ${flipY})`, transformOrigin: "0 0" }}
        >
          <svg
            className="gp-bob absolute -left-[78px] -top-[78px] h-16 w-16 overflow-visible"
            viewBox="0 0 64 64"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 6 L56 56 M56 30 L56 56 L30 56" stroke="white" strokeWidth="12" />
            <path d="M6 6 L56 56 M56 30 L56 56 L30 56" stroke="#FF6414" strokeWidth="7" />
          </svg>
        </div>
      )}
    </div>
  );
}

export type TapRipple = Pt & { id: string };

/** Overlay that draws helper pointers, the live laser trail, and owner taps. */
export function MarkerLayer({
  markers,
  trail = [],
  taps = [],
}: {
  markers: Marker[];
  trail?: Pt[];
  taps?: TapRipple[];
}) {
  const steps = markers.filter((m) => m.tool === "step");
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {steps.length > 1 && (
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <polyline
            points={steps.map((s) => `${s.x},${s.y}`).join(" ")}
            fill="none"
            stroke="#FF6414"
            strokeWidth="3"
            strokeDasharray="1 9"
            strokeLinecap="round"
            opacity="0.88"
          />
        </svg>
      )}

      {/* Smooth glowing path line underneath the laser comet */}
      {trail.length > 1 && (
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <polyline
            points={trail.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          <polyline
            points={trail.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#FF6414"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.92"
          />
        </svg>
      )}

      {/* High-visibility electric-blue owner tap ripples */}
      {taps.map((t) => (
        <span key={t.id} className="absolute" style={{ left: t.x, top: t.y }}>
          <span className="gp-tap-wave absolute -left-9 -top-9 block h-18 w-18 rounded-full border-[3.5px] border-sky-400 bg-sky-400/25 shadow-[0_0_24px_4px_rgba(14,165,233,0.55)]" />
          <span className="gp-tap-wave-delay absolute -left-7 -top-7 block h-14 w-14 rounded-full border-[3px] border-cyan-300 bg-sky-500/20" />
          <span className="gp-tap-core absolute -left-3 -top-3 block h-6 w-6 rounded-full bg-sky-500 ring-[3px] ring-white shadow-[0_0_16px_4px_rgba(14,165,233,0.85)]" />
        </span>
      ))}

      {markers.map((m) => (
        <div key={m.id} className="absolute" style={{ left: m.x, top: m.y }}>
          <MarkerGlyph tool={m.tool} step={m.step} done={m.done} x={m.x} y={m.y} />
        </div>
      ))}

      {trail.map((p, i) => {
        const k = (i + 1) / trail.length;
        const head = i === trail.length - 1;
        return (
          <span
            key={i}
            className="absolute rounded-full bg-laser"
            style={{
              left: p.x,
              top: p.y,
              width: head ? 20 : 5 + 9 * k,
              height: head ? 20 : 5 + 9 * k,
              transform: "translate(-50%, -50%)",
              opacity: head ? 1 : 0.25 + 0.65 * k,
              boxShadow: head ? "0 0 0 4px #fff, 0 0 26px 9px rgba(255,100,20,.72)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * A pointer that finds its own position by looking up `[data-guide=target]`
 * inside the stage. Used by the self-guided demo and the landing page.
 */
export function GuideMarker({
  target,
  stageRef,
  scale,
  tool = "ring",
}: {
  target: string;
  stageRef?: RefObject<HTMLDivElement | null>;
  scale: number;
  tool?: Tool;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    const stage = stageRef?.current ?? node?.parentElement ?? null;
    if (!stage || !node) return;
    const place = () => {
      const el = stage.querySelector<HTMLElement>(`[data-guide="${target}"]`);
      if (!el) {
        node.style.opacity = "0";
        return;
      }
      const r = el.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const x = (r.left + r.width * 0.58 - s.left) / scale;
      const y = (r.bottom - Math.min(8 * scale, r.height * 0.18) - s.top) / scale;
      node.style.transform = `translate(${x}px, ${y}px)`;
      node.style.opacity = "1";
    };
    place();
    const raf = requestAnimationFrame(place);
    const t = setTimeout(place, 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [target, scale, stageRef]);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 z-30 transition-opacity duration-300"
      style={{ opacity: 0 }}
    >
      <MarkerGlyph tool={tool} />
    </div>
  );
}

export function CaptionBubble({ from, text }: { from: string; text: string }) {
  return (
    <div
      className="gp-rise pointer-events-none absolute inset-x-3 bottom-[76px] z-40 flex gap-3 rounded-2xl bg-slate-900/95 p-3.5 text-white shadow-2xl ring-1 ring-white/15"
      role="status"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-volt text-[14px] font-bold">
        {from[0]}
      </span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{from}</div>
        <p className="mt-0.5 text-[15px] font-medium leading-snug text-white">{text}</p>
      </div>
    </div>
  );
}
