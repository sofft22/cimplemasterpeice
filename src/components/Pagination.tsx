interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav className="mt-16 flex items-center justify-between gap-4 border-t border-[#e5e5e5] pt-6 sm:mt-20">
      <p className="text-[12px] font-medium text-black/60 sm:text-[13px]">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={!canPrev}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose/40 text-rose transition-colors duration-300 ease-premium hover:border-rose hover:bg-rose/5 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={!canNext}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose/40 text-rose transition-colors duration-300 ease-premium hover:border-rose hover:bg-rose/5 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </nav>
  );
}