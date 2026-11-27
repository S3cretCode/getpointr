import type { ReactNode, Ref } from "react";

/** Logical width of the mock phone. Everything inside the stage uses logical px. */
export const W = 390;
export const FRAME_PAD = 11;
/** Extra logical height added by the iOS status bar (50) + home indicator (24) when framed. */
export const IPHONE_CHROME_H = 74;

/** Computes the exact scale factor so the full framed iPhone (including outer bezel) fits inside availW × availH. */
export function fitStageScale(availW: number, availH: number, appH: number, maxScale = 1.04) {
  const sw = (availW - FRAME_PAD * 2) / W;
  const sh = (availH - FRAME_PAD * 2) / (appH + IPHONE_CHROME_H);
  return Math.max(0.28, Math.min(sw, sh, maxScale));
}

/**
 * Renders children inside an authentic iPhone 16 Pro frame at logical size (W × height).
 * Because `innerRef` always wraps only the app area (W × height), pointer coordinates
 * stay 1:1 across mobile and desktop on both Host and Helper ends.
 */
export function Stage({
  height,
  scale,
  children,
  innerRef,
  framed = true,
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
      <div
        className={`relative shrink-0 overflow-hidden ${className}`}
        style={{ width: W * scale, height: height * scale }}
      >
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
      {/* Hardware side buttons (Action button, Volume Up/Down, Side Power) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[2.5px] top-[14.5%] h-5 w-[2.5px] rounded-l-sm bg-[#464e5c]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[2.5px] top-[22%] h-10 w-[2.5px] rounded-l-sm bg-[#464e5c]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[2.5px] top-[31%] h-10 w-[2.5px] rounded-l-sm bg-[#464e5c]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[2.5px] top-[25%] h-14 w-[2.5px] rounded-r-sm bg-[#464e5c]"
      />

      {/* Brushed titanium shell + concentric black glass bezel */}
      <div className="relative h-full w-full rounded-[50px] bg-gradient-to-b from-[#4a5260] via-[#262b34] to-[#383f4b] p-[2.5px] shadow-[0_26px_64px_-12px_rgba(0,0,0,0.75)] ring-1 ring-white/15">
        <div
          className="relative h-full w-full overflow-hidden rounded-[47.5px] bg-[#07080a]"
          style={{ padding: pad - 2.5 }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[39px] bg-white">
            <div
              className="absolute left-0 top-0 flex flex-col bg-white"
              style={{
                width: W,
                height: logicalH,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }}
            >
              {/* Authentic iOS 18 Status Bar + Dynamic Island */}
              <div
                aria-hidden="true"
                className="relative flex h-[50px] shrink-0 items-center justify-between bg-white px-5 text-[#0b0f17]"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
                }}
              >
                {/* Left ear: iOS Semibold Time */}
                <div className="flex w-[92px] items-center justify-center pl-1">
                  <span
                    style={{
                      fontSize: 15.5,
                      fontWeight: 600,
                      letterSpacing: "-0.32px",
                      lineHeight: 1,
                    }}
                  >
                    9:41
                  </span>
                </div>

                {/* Center: Dynamic Island with recessed lens */}
                <div className="absolute left-1/2 top-[9px] flex h-[33px] w-[120px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
                  <span className="relative grid h-[11px] w-[11px] place-items-center rounded-full bg-[#0e1420] ring-1 ring-white/10">
                    <span className="h-[3.5px] w-[3.5px] -translate-x-[1px] -translate-y-[1px] rounded-full bg-[#5b86b0]/55" />
                  </span>
                </div>

                {/* Right ear: Authentic iOS Cellular + Solid Wi-Fi Wedge + Battery Capsule */}
                <div className="flex w-[92px] items-center justify-center gap-[6px] pr-1 text-[#0b0f17]">
                  {/* 4-bar iOS cellular signal */}
                  <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
                    <rect x="0.2" y="7.2" width="3" height="3.8" rx="1" />
                    <rect x="4.6" y="5.1" width="3" height="5.9" rx="1" />
                    <rect x="9.0" y="2.6" width="3" height="8.4" rx="1" />
                    <rect x="13.4" y="0.2" width="3" height="10.8" rx="1" />
                  </svg>

                  {/* Authentic iOS filled Wi-Fi fan */}
                  <svg width="15.5" height="11" viewBox="0 0 16 11.5" fill="currentColor">
                    <path d="M8 2.1c2.7 0 5.15 1 7.05 2.72a.45.45 0 0 0 .63-.02l.95-.98a.47.47 0 0 0-.02-.67A12.1 12.1 0 0 0 8 0C4.7 0 1.7 1.24-.61 3.05a.47.47 0 0 0-.02.67l.95.98c.17.18.45.19.63.02A10.25 10.25 0 0 1 8 2.1Z" transform="translate(0, 0.3) scale(0.95)" />
                    <path d="M8 5.45c1.73 0 3.31.66 4.53 1.77.18.17.46.16.63-.02l.95-.99a.48.48 0 0 0-.03-.68A8.3 8.3 0 0 0 8 3.35c-2.36 0-4.5.93-6.08 2.18a.48.48 0 0 0-.03.68l.95.99c.17.18.45.19.63.02A6.5 6.5 0 0 1 8 5.45Z" />
                    <path d="M9.85 9.15a2.45 2.45 0 0 0-3.7 0 .46.46 0 0 0 .02.64l1.52 1.54a.47.47 0 0 0 .66 0l1.52-1.54a.46.46 0 0 0-.02-.64Z" />
                  </svg>

                  {/* Authentic iOS Battery */}
                  <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                    <rect
                      x="0.6"
                      y="0.8"
                      width="21"
                      height="10.4"
                      rx="3.2"
                      stroke="#0b0f17"
                      strokeOpacity="0.38"
                      strokeWidth="1.1"
                    />
                    <rect x="2.2" y="2.4" width="16.4" height="7.2" rx="1.8" fill="#0b0f17" />
                    <path
                      d="M23 4.2v3.6a1.8 1.8 0 0 0 0-3.6Z"
                      fill="#0b0f17"
                      fillOpacity="0.42"
                    />
                  </svg>
                </div>
              </div>

              {/* App stage (exact W × height coordinate space) */}
              <div ref={innerRef} className="relative" style={{ width: W, height }}>
                {children}
              </div>

              {/* iOS Home Indicator */}
              <div
                aria-hidden="true"
                className="flex h-[24px] shrink-0 items-end justify-center bg-white pb-[7px]"
              >
                <span className="h-[5px] w-[136px] rounded-full bg-[#0b0f17]/88" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
