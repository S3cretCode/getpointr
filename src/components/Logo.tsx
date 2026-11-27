/**
 * Gentle Beacon mark: deep charcoal (#232830) rounded square, dusty slate-blue (#78A3C8)
 * open concentric ring with rounded caps, warm off-white (#F6F5F0) center dot, and
 * minimalist off-white pointer arrow hovering at the bottom-right gap.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#232830" />
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="9.25"
        stroke="#F6F5F0"
        strokeOpacity="0.14"
        strokeWidth="1.5"
      />
      {/* Open concentric dusty-blue ring (gap in bottom-right from ~22deg to ~72deg) */}
      <path
        d="M 23.8 30.8 A 11.5 11.5 0 1 1 30.8 23.6"
        stroke="#78A3C8"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Off-white center target dot */}
      <circle cx="19.5" cy="19.5" r="4.2" fill="#F6F5F0" />
      {/* Minimalist off-white cursor arrow hovering in the gap without touching the dot */}
      <path
        d="M 23.4 23.4 L 31.8 26.5 L 28.4 28.0 L 31.3 30.9 L 29.5 32.7 L 26.6 29.8 L 25.1 33.2 Z"
        fill="#F6F5F0"
      />
    </svg>
  );
}

export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight text-gp-text ${className}`}>
      <LogoMark size={size} />
      <span className="text-[18px] leading-none">
        Get<span className="text-gp-accent">Pointr</span>
      </span>
    </span>
  );
}
