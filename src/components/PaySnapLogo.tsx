export function PaySnapLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <div
        className={`${iconSize} flex items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-xs`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <rect x="5" y="4" width="14" height="16" rx="3" fill="currentColor" />
          <path
            d="M13 7.5L9.5 12.5H12.2L11 16.5L14.5 11.5H11.8L13 7.5Z"
            fill="#1D4ED8"
          />
          <circle cx="17.5" cy="6.5" r="2" fill="#10B981" />
        </svg>
      </div>
      <span
        className={`font-display ${textSize} font-bold tracking-tight text-slate-900 whitespace-nowrap`}
      >
        PaySnap
      </span>
    </div>
  );
}
