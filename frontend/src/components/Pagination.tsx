interface PaginationProps {
  page: number;
  totalPages: number;
  rangeLabel: string;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, rangeLabel, onChange }: PaginationProps) {
  const current = page + 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const navBtn = (disabled: boolean) =>
    `rounded-[7px] border border-(--color-border) bg-white px-3 py-1.5 text-[13px] font-semibold ${
      disabled ? 'cursor-default text-(--color-border)' : 'cursor-pointer text-(--color-text)'
    }`;

  const pageBtn = (active: boolean) =>
    `min-w-[30px] rounded-[7px] border px-2 py-1.5 text-[13px] font-semibold ${
      active
        ? 'border-transparent bg-(--color-accent) text-white'
        : 'border-(--color-border) bg-white text-(--color-text)'
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-7 md:py-4">
      <div className="text-[13px] text-(--color-text-muted)">{rangeLabel}</div>
      {totalPages > 1 && (
        <div className="flex max-w-full items-center gap-1 overflow-x-auto">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => onChange(page - 1)}
            className={`shrink-0 ${navBtn(page <= 0)}`}
          >
            Prev
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n - 1)}
              className={`shrink-0 ${pageBtn(n === current)}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onChange(page + 1)}
            className={`shrink-0 ${navBtn(page >= totalPages - 1)}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
