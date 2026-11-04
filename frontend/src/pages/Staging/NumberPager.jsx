import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 10;

/**
 * Navigasi nomor soal per 10 untuk halaman cek soal staging, dengan penunjuk
 * "posisi / total". renderNumber(index) merender tombol nomor milik halaman.
 */
const NumberPager = ({ total, current, onSelect, renderNumber, label }) => {
  const page = Math.floor(current / PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);

  const arrowClass =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 sm:h-8 sm:w-8";

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2">
      {pageCount > 1 && (
        <button
          type="button"
          aria-label={`${PAGE_SIZE} soal sebelumnya`}
          disabled={page === 0}
          onClick={() => onSelect(start - PAGE_SIZE)}
          className={arrowClass}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      )}

      <div
        aria-label={label}
        className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto px-1 py-0.5 sm:gap-2"
      >
        {Array.from({ length: end - start }, (_, offset) => renderNumber(start + offset))}
      </div>

      {pageCount > 1 && (
        <button
          type="button"
          aria-label={`${PAGE_SIZE} soal berikutnya`}
          disabled={page >= pageCount - 1}
          onClick={() => onSelect(start + PAGE_SIZE)}
          className={arrowClass}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}

      <span
        aria-live="polite"
        className="shrink-0 whitespace-nowrap pl-1 font-mono text-[11px] font-bold text-slate-600 sm:text-xs"
      >
        {current + 1} / {total}
      </span>
    </div>
  );
};

export default NumberPager;
