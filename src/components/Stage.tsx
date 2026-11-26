import type { ReactNode, Ref } from "react";

/** Logical width of the mock phone. Everything inside the stage uses logical px. */
export const W = 390;
export const FRAME_PAD = 11;
/** Extra logical height added by the iPhone status bar (44) + home indicator (22) when framed. */
export const IPHONE_CHROME_H = 66;

/**
 * Renders children at a fixed logical size (W × height) and scales them
 * visually. Because `innerRef` always wraps only the app area (W × height),
 * pointer coordinates stay 1:1 between a real phone (unframed) and the
 * helper's iPhone mockup (framed).
 */
export function Stage({
  height,
  scale,
  children,
  innerRef,
  framed = false,
  className = "",
}: {
  height: number;
  scale: number;
  children: ReactNode;
  innerRef?: Ref<HTMLDivElement>;
  framed?: boolean;
  className?: string;
}) {
  if (!framed) {
    return (
      <div className={`relative shrink-0 overflow-hidden ${className}`} style={{ width: W * scale, height: height * scale }}>
        <div
          ref={innerRef}
          className="absolute left-0 top-0"
          style={{ width: W, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          {children}
        </div>
      </div>
    );
  }

  const logicalH = height + IPHONE_CHROME_H;
  const screenW = W * scale;
  const screenH = logicalH * scale;
  const pad = FRAME_PAD;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: screenW + pad * 2, height: screenH + pad * 2 }}
    >
      {/* Hardware side buttons */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[3px] top-[15%] h-6 w-[3px] rounded-l-sm bg-slate-600/90"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[3px] top-[23%] h-11 w-[3px] rounded-l-sm bg-slate-600/90"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[3px] top-[33%] h-11 w-[3px] rounded-l-sm bg-slate-600/90"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[3px] top-[26%] h-14 w-[3px] rounded-r-sm bg-slate-600/90"
      />

      {/* Titanium outer shell + black screen bezel */}
      <div
        className="relative h-full w-full rounded-[48px] bg-gradient-to-b from-[#3b4252] via-[#1c212b] to-[#2e3440] p-[3px] shadow-[0_28px_70px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/15"
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-[45px] bg-black"
          style={{ padding: pad - 3 }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-white">
            <div
              className="absolute left-0 top-0 flex flex-col bg-white"
              style={{
                width: W,
                height: logicalH,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }}
            >
              {/* iOS Status Bar + Dynamic Island */}
              <div
                aria-hidden="true"
                className="relative flex h-[44px] shrink-0 items-center justify-between bg-white px-6 text-slate-900"
              >
                <span className="text-[14px] font-semibold tracking-tight">9:41</span>

                {/* Dynamic Island */}
                <div className="absolute left-1/2 top-[9px] flex h-[26px] w-[108px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5 shadow-inner">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#111927] ring-1 ring-slate-700/70">
                    <span className="block h-1 w-1 translate-x-[3px] translate-y-[2px] rounded-full bg-sky-400/40" />
                  </span>
                </div>

                {/* Signal + Wi-Fi + Battery */}
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
                    <rect x="0" y="7" width="2.6" height="4" rx="0.8" />
                    <rect x="4.2" y="5" width="2.6" height="6" rx="0.8" />
                    <rect x="8.4" y="2.5" width="2.6" height="8.5" rx="0.8" />
                    <rect x="12.6" y="0" width="2.6" height="11" rx="0.8" />
                  </svg>
                  <svg width="15" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0" />
                    <path d="M4.2 7a5.6 5.6 0 0 1 7.6 0" />
                    <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                  <div className="flex items-center gap-[1.5px]">
                    <div className="flex h-[11px] w-[22px] items-center rounded-[3px] border border-slate-900/70 p-[1.5px]">
                      <div className="h-full w-[82%] rounded-[1.5px] bg-slate-900" />
                    </div>
                    <span className="h-[4px] w-[1.5px] rounded-r-sm bg-slate-900/70" />
                  </div>
                </div>
              </div>

              {/* App stage (exact W × height coordinate space) */}
              <div ref={innerRef} className="relative" style={{ width: W, height }}>
                {children}
              </div>

              {/* iOS Home Indicator */}
              <div
                aria-hidden="true"
                className="flex h-[22px] shrink-0 items-end justify-center bg-white pb-[7px]"
              >
                <span className="h-[5px] w-[134px] rounded-full bg-slate-900/85" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
