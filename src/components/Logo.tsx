import { useId } from "react";

export function LogoMark({ size = 30 }: { size?: number }) {
  const uid = useId();
  const bgId = `gp-bg-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={bgId} x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8238" />
          <stop offset="55%" stopColor="#FF6414" />
          <stop offset="100%" stopColor="#D9480F" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10.5" fill={`url(#${bgId})`} />
      <rect x="0.75" y="0.75" width="34.5" height="34.5" rx="9.75" stroke="white" strokeOpacity="0.26" strokeWidth="1.5" />
      {/* Target beacon arcs */}
      <path d="M9.5 22.5A9.5 9.5 0 1 1 23.2 9.9" stroke="white" strokeOpacity="0.55" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="16.5" cy="16.5" r="4.2" fill="white" />
      {/* Precision pointer arrow pointing toward the beacon without touching */}
      <path
        d="M21.2 21.2L29.2 24.1L25.4 25.8L23.7 29.6L21.2 21.2Z"
        fill="white"
        stroke="#C23A08"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight text-gp-text ${className}`}>
      <LogoMark size={size} />
      <span className="text-[18px] leading-none">
        Get<span className="text-laser">Pointr</span>
      </span>
    </span>
  );
}
