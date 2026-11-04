import React, { useState } from "react";
import crownIcon from "../assets/crown-icon.webp";
import { activateTrial } from "../api/subscription";

/**
 * Ajakan trial premium untuk paket free.
 * - trial tersedia: tombol → tampilan konfirmasi (sekali per akun, 3 hari,
 *   wajib centang) → POST /subscription/trial → onActivated(entitlement).
 *   onConfirmChange(true/false) agar induk menyembunyikan isi lain sehingga
 *   konfirmasi tampil sebagai isi modal/panel yang sama.
 * - trial sudah dipakai: info saja (pembayaran belum tersedia)
 * - premium / entitlement belum ada: tidak dirender
 */
const TrialCallout = ({ entitlement, onActivated, onConfirmChange, appearance = "primary" }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState("");

  if (!entitlement || entitlement.plan !== "free") return null;

  if (!entitlement.trial?.available) {
    return (
      <p className="text-xs text-slate-500">
        Trial premium sudah digunakan. Paket Premium berbayar segera tersedia.
      </p>
    );
  }

  const changeConfirming = (value) => {
    setIsConfirming(value);
    setAgreed(false);
    setMessage("");
    onConfirmChange?.(value);
  };

  if (!isConfirming) {
    const buttonAppearance = appearance === "secondary"
      ? "w-full bg-[#ff8a1f] text-white shadow-xs hover:bg-[#e87512]"
      : "bg-primary text-white shadow-xs hover:bg-primary-hover";
    return (
      <button
        type="button"
        onClick={() => changeConfirming(true)}
        className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${buttonAppearance}`}
      >
        Coba Premium 3 Hari Gratis
      </button>
    );
  }

  const handleActivate = async () => {
    setIsActivating(true);
    setMessage("");
    try {
      const result = await activateTrial();
      if (result.ok) {
        onActivated?.(result.entitlement);
        return;
      }
      setMessage(result.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Trial gagal dimulai. Coba lagi.",
      );
    }
    setIsActivating(false);
  };

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center gap-2.5 pr-8">
        <img
          src={crownIcon}
          alt=""
          width="32"
          height="32"
          className="h-8 w-8 shrink-0 object-contain"
        />
        <h3 className="text-lg font-bold text-slate-900">
          Coba Premium 3 Hari
        </h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-500">
        Selama trial, semua bab terbuka dan kuis tanpa batas. Setelah 3 hari,
        akun kembali ke paket Free.
      </p>

      <ul className="mb-4 space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <li>• Trial hanya bisa digunakan <b>satu kali per akun</b>.</li>
        <li>
          • Berlaku <b>3 hari (72 jam)</b> sejak diaktifkan dan tidak bisa
          dijeda.
        </li>
      </ul>

      <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        />
        Saya mengerti trial hanya sekali per akun dan berlaku 3 hari.
      </label>

      {message && (
        <p role="alert" className="mb-3 text-xs text-red-700">
          {message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => changeConfirming(false)}
          disabled={isActivating}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={handleActivate}
          disabled={!agreed || isActivating}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isActivating ? "Mengaktifkan..." : "Aktifkan Trial"}
        </button>
      </div>
    </div>
  );
};

export default TrialCallout;
