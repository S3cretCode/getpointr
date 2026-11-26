export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#FF6B1A" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#fff" strokeWidth="2.4" opacity=".5" />
      <circle cx="16" cy="16" r="4.2" fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoMark size={size} />
      <span className="text-[17px] leading-none">
        Get<span className="text-laser">Pointr</span>
      </span>
    </span>
  );
}
