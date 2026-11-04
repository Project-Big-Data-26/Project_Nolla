import { Link } from "react-router-dom";
import { buildCheckUrl } from "../../api/stagingSoalCheck";

// Filter pintu 1 per halaman. Jumlah dari summary backend (seluruh subbab, halaman ini):
// belum dicek = unchecked + stale (hasil cek usang dihitung belum).
const FILTERS = [
  { label: "Semua", review: null, aprove: null, count: (s) => s.total },
  { label: "Belum dicek", review: "0", aprove: null, count: (s, p) => p.unchecked + p.stale },
  { label: "Sudah dicek", review: "1", aprove: null, count: (s, p) => p.ok + p.broken },
  { label: "Tampil benar", review: null, aprove: "1", count: (s, p) => p.ok },
  { label: "Rusak", review: null, aprove: "0", count: (s, p) => p.broken },
];

/** Tautan filter review/aprove untuk halaman cek soal (page: "question" | "review"). */
const CheckFilterBar = ({ page, subbabId, review, aprove, summary }) => {
  const pageSummary = summary?.[page];

  return (
    <nav aria-label="Saring soal" className="flex shrink-0 flex-wrap items-center gap-1.5">
      {FILTERS.map((filter) => {
        const isActive = filter.review === review && filter.aprove === aprove;
        const count = pageSummary ? filter.count(summary, pageSummary) : null;

        return (
          <Link
            key={filter.label}
            to={buildCheckUrl(page, {
              subbabId,
              review: filter.review,
              aprove: filter.aprove,
            })}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
              isActive
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
            {count !== null && ` (${count})`}
          </Link>
        );
      })}
    </nav>
  );
};

export default CheckFilterBar;
