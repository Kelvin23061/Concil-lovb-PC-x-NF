export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg shadow-primary/25 ${className ?? ""}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-6">
        <path
          d="M4 8h9m0 0-3-3m3 3-3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 16h-9m0 0 3-3m-3 3 3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
