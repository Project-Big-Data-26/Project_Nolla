import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getCheckErrorMessage,
  toCheckMeta,
  updateSoalCheck,
} from "../api/stagingSoalCheck";

const LEVEL_STYLES = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-rose-50 text-rose-700 border-rose-200",
};

const describeState = (state) => {
  if (!state || state.value === null) return { text: "Belum dicek", style: "text-slate-500" };
  if (state.stale) return { text: "Perlu cek ulang (soal diubah)", style: "text-amber-700" };
  return state.value
    ? { text: "Tampil benar", style: "text-emerald-700" }
    : { text: "Rusak", style: "text-rose-700" };
};

/**
 * Label soal_id & level + tombol hasil cek untuk satu soal di satu halaman
 * (page "question" = tampilan soal, "review" = tampilan review). Khusus staging.
 */
const StagingSoalCheckPanel = ({ meta, page, onUpdated, switchTo, showSequence = false }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!meta) return null;

  const state = meta.check?.[page];
  const description = describeState(state);

  const save = async (value) => {
    setSaving(true);
    setError("");
    try {
      // Respons PATCH tidak membawa nomor asli di subbab; pertahankan dari meta.
      const updated = toCheckMeta(await updateSoalCheck(meta.id, page, value));
      onUpdated({ ...updated, sequence: meta.sequence });
    } catch (requestError) {
      setError(getCheckErrorMessage(requestError, "Status cek gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  const buttonBase =
    "rounded-xl px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <section
      aria-label="Panel cek soal staging"
      className="flex shrink-0 flex-col gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-3"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
          Staging · {page === "question" ? "Halaman soal" : "Halaman review"}
        </span>
        {showSequence && meta.sequence && (
          <span className="font-bold text-slate-700">No. {meta.sequence}</span>
        )}
        <span className="text-slate-500">soal_id</span>
        <code className="select-all break-all rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-800">
          {meta.id}
        </code>
        <span
          className={`rounded-md border px-1.5 py-0.5 font-bold ${
            LEVEL_STYLES[meta.cognitiveLevel] ?? "border-slate-200 bg-white text-slate-600"
          }`}
        >
          {meta.cognitiveLevel ?? "-"}
        </span>
        {meta.storedLevel === null ? (
          <span className="font-semibold text-amber-800">level belum diisi</span>
        ) : (
          meta.storedLevel !== meta.cognitiveLevel && (
            <span className="text-slate-500">tersimpan: {meta.storedLevel}</span>
          )
        )}
        {meta.status && meta.status !== "active" && (
          <span className="font-semibold text-slate-600">status: {meta.status}</span>
        )}
        <span className={`font-bold ${description.style}`} aria-live="polite">
          · {description.text}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={saving}
          onClick={() => save(true)}
          className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          Tampil benar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(false)}
          className={`${buttonBase} bg-rose-600 text-white hover:bg-rose-700`}
        >
          Rusak
        </button>
        <button
          type="button"
          disabled={saving || !state || state.value === null}
          onClick={() => save(null)}
          className={`${buttonBase} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        >
          Reset
        </button>
        {switchTo && (
          <Link
            to={switchTo.href}
            className={`${buttonBase} border border-primary/30 bg-white text-primary hover:bg-primary/10`}
          >
            {switchTo.label}
          </Link>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-700 sm:basis-full">
          {error}
        </p>
      )}
    </section>
  );
};

export default StagingSoalCheckPanel;
