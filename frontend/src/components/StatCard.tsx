interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div>
        <div className="text-xl font-extrabold leading-none">{value}</div>
        <div className="mt-0.5 text-xs font-semibold text-(--color-text-muted)">{label}</div>
      </div>
    </div>
  );
}
