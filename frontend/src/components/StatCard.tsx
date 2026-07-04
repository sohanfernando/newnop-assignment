interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0">
        <div className="text-lg font-extrabold leading-none sm:text-xl">{value}</div>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-(--color-text-muted) sm:text-xs">{label}</div>
      </div>
    </div>
  );
}
