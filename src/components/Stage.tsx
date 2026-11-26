import type { ReactNode, Ref } from "react";

/** Logical width of the mock phone. Everything inside the stage uses logical px. */
export const W = 390;
export const FRAME_PAD = 10;

/**
 * Renders children at a fixed logical size (W × height) and scales them
 * visually. Because both phone and helper use the same logical size, a
 * coordinate on one screen lands on exactly the same element on the other.
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
  const pad = framed ? FRAME_PAD * 2 : 0;
  return (
    <div
      className={`relative shrink-0 ${
        framed ? "rounded-[38px] bg-ink-800 shadow-2xl shadow-black/60 ring-1 ring-white/10" : ""
      } ${className}`}
      style={{ width: W * scale + pad, height: height * scale + pad, padding: pad / 2 }}
    >
      <div className={`relative h-full w-full overflow-hidden ${framed ? "rounded-[29px]" : ""}`}>
        <div
          ref={innerRef}
          className="absolute left-0 top-0"
          style={{ width: W, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
