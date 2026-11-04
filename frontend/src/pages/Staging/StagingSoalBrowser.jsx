import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StagingQuestionPage from "./StagingQuestionPage";
import {
  buildCheckUrl,
  fetchCheckTree,
  getCheckErrorMessage,
} from "../../api/stagingSoalCheck";

const matches = (value, query) =>
  String(value ?? "").toLowerCase().includes(query);

// Status review subbab: semua soal sudah diberi status di halaman soal & review.
const getSubbabStatus = (subbab) => {
  if (!subbab.soal_count) return "empty";
  return subbab.reviewed_count >= subbab.soal_count ? "done" : "pending";
};

const STATUS_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Belum direview" },
  { value: "done", label: "Sudah direview" },
];

// Saring subbab menurut status; bab/kelas yang jadi kosong ikut disembunyikan.
const filterByStatus = (kelasList, status) => {
  if (status === "all") return kelasList;
  return kelasList.flatMap((kelas) => {
    const bab = kelas.bab.flatMap((babItem) => {
      const subbab = babItem.subbab.filter((item) => getSubbabStatus(item) === status);
      return subbab.length ? [{ ...babItem, subbab }] : [];
    });
    return bab.length ? [{ ...kelas, bab }] : [];
  });
};

const countByStatus = (kelasList) => {
  const counts = { all: 0, pending: 0, done: 0 };
  for (const kelas of kelasList) {
    for (const bab of kelas.bab) {
      for (const subbab of bab.subbab) {
        counts.all += 1;
        const status = getSubbabStatus(subbab);
        if (status in counts) counts[status] += 1;
      }
    }
  }
  return counts;
};

// Saring pohon: simpan cabang yang namanya cocok atau punya turunan yang cocok.
const filterTree = (kelasList, query) => {
  if (!query) return kelasList;
  return kelasList.flatMap((kelas) => {
    if (matches(kelas.name, query) || matches(kelas.jenjang, query)) return [kelas];
    const bab = kelas.bab.flatMap((babItem) => {
      if (matches(babItem.name, query)) return [babItem];
      const subbab = babItem.subbab.filter((item) => matches(item.name, query));
      return subbab.length ? [{ ...babItem, subbab }] : [];
    });
    return bab.length ? [{ ...kelas, bab }] : [];
  });
};

/** Pemilih kelas -> bab -> subbab untuk pintu cek soal staging (tanpa subbabId/soalId). */
const StagingSoalBrowser = () => {
  const navigate = useNavigate();
  const [tree, setTree] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [soalId, setSoalId] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let isCurrent = true;
    fetchCheckTree()
      .then((kelas) => {
        if (isCurrent) setTree(kelas);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(getCheckErrorMessage(requestError, "Daftar kelas gagal dimuat."));
        }
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleTree = useMemo(
    () => filterTree(filterByStatus(tree ?? [], status), normalizedQuery),
    [tree, status, normalizedQuery],
  );
  const statusCounts = useMemo(() => countByStatus(tree ?? []), [tree]);
  // Saat mencari atau menyaring status, buka semua cabang agar hasil langsung terlihat.
  const expandAll = Boolean(normalizedQuery) || status !== "all";

  const openSoal = (event) => {
    event.preventDefault();
    const id = soalId.trim();
    if (id) navigate(buildCheckUrl("question", { soalId: id }));
  };

  return (
    <main className="min-h-screen bg-neutral-bg px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Staging
          </p>
          <h1 className="text-xl font-extrabold text-slate-900">Cek soal</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pilih kelas, bab, lalu subbab untuk memeriksa tampilan soal.
          </p>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kelas, bab, atau subbab"
            aria-label="Cari kelas, bab, atau subbab"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <form onSubmit={openSoal} className="flex gap-2">
            <input
              value={soalId}
              onChange={(event) => setSoalId(event.target.value)}
              placeholder="soal_id"
              aria-label="Buka satu soal lewat soal_id"
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm sm:w-56"
            />
            <button
              type="submit"
              disabled={!soalId.trim()}
              className="shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Buka soal
            </button>
          </form>
        </div>

        {tree && (
          <div role="group" aria-label="Saring status review subbab" className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={status === filter.value}
                onClick={() => setStatus(filter.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                  status === filter.value
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filter.label} ({statusCounts[filter.value]})
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {!tree && !error && <p className="text-sm text-slate-600">Memuat daftar kelas...</p>}

        {tree && visibleTree.length === 0 && (
          <p className="text-sm text-slate-600">
            {normalizedQuery || status !== "all"
              ? "Tidak ada subbab yang cocok."
              : "Belum ada data kelas."}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {visibleTree.map((kelas) => (
            <li key={kelas.kelas_id}>
              <details
                open={expandAll ? true : undefined}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800">
                  {kelas.jenjang ? `${kelas.jenjang} · ` : ""}
                  {kelas.name || "Kelas tanpa nama"}
                  <span className="ml-2 font-normal text-slate-500">{kelas.bab.length} bab</span>
                </summary>

                <ul className="flex flex-col gap-1 px-3 pb-3">
                  {kelas.bab.length === 0 && (
                    <li className="px-2 text-sm text-slate-500">Belum ada bab.</li>
                  )}
                  {kelas.bab.map((bab) => (
                    <li key={bab.bab_id}>
                      <details open={expandAll ? true : undefined}>
                        <summary className="cursor-pointer rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          {bab.name || "Bab tanpa nama"}
                        </summary>

                        <ul className="ml-4 border-l border-slate-100 pl-2">
                          {bab.subbab.length === 0 && (
                            <li className="px-2 py-1 text-sm text-slate-500">Belum ada subbab.</li>
                          )}
                          {bab.subbab.map((subbab) => (
                            <li key={subbab.subbab_id}>
                              {subbab.soal_count > 0 ? (
                                <Link
                                  to={buildCheckUrl("question", { subbabId: subbab.subbab_id })}
                                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-primary hover:bg-primary/5"
                                >
                                  <span>{subbab.name || "Subbab tanpa nama"}</span>
                                  <span className="flex shrink-0 items-center gap-2 text-xs">
                                    {subbab.broken_count > 0 && (
                                      <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-bold text-rose-700">
                                        {subbab.broken_count} rusak
                                      </span>
                                    )}
                                    <span
                                      className={
                                        getSubbabStatus(subbab) === "done"
                                          ? "font-bold text-emerald-700"
                                          : "text-slate-500"
                                      }
                                    >
                                      {subbab.reviewed_count}/{subbab.soal_count} direview
                                    </span>
                                  </span>
                                </Link>
                              ) : (
                                <span className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-slate-400">
                                  <span>{subbab.name || "Subbab tanpa nama"}</span>
                                  <span className="shrink-0 text-xs">0 soal</span>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

// /staging/cek-soal: tanpa subbabId/soalId tampilkan pemilih, selain itu halaman soal mode cek.
export const StagingCheckRoute = () => {
  const [searchParams] = useSearchParams();
  const hasTarget = searchParams.get("subbabId") || searchParams.get("soalId");
  return hasTarget ? <StagingQuestionPage /> : <StagingSoalBrowser />;
};

export default StagingSoalBrowser;
