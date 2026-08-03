export function CartIcon({ className = "h-4 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M2 2a1 1 0 0 0 0 2h1.22l.63 2.51.94 6.4A2 2 0 0 0 6.75 15H15a1 1 0 1 0 0-2H6.75l-.15-1H15a1 1 0 0 0 .97-.76l1.25-5A1 1 0 0 0 16.25 5H4.98l-.34-1.36A1 1 0 0 0 3.68 3H2Zm4.5 14.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}
