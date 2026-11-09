import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Info,
  LifeBuoy,
  Send,
  X,
} from "lucide-react";
import nollaMain from "../../assets/nolla_main.webp";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const ISSUE_TYPES = [
  "Masalah teknis",
  "Kesalahan materi atau soal",
  "Masalah akun",
  "Masalah paket atau pembayaran",
  "Laporkan penyalahgunaan",
  "Lainnya",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TIPS = [
  "Apa yang terjadi dan kapan masalah muncul",
  "Langkah yang sudah kamu coba",
];

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#1b1f3b] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
const labelClassName = "block text-sm font-semibold text-slate-900";
const cardClassName =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6";

function validateImage(file) {
  if (!file) return "Pilih gambar yang ingin dilampirkan.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (
    !ALLOWED_IMAGE_TYPES.includes(file.type) ||
    !["jpg", "jpeg", "png", "webp"].includes(extension)
  ) {
    return "Format lampiran harus PNG, JPG, atau WEBP.";
  }
  if (file.size > MAX_IMAGE_SIZE) return "Ukuran gambar maksimal 5 MB.";
  return "";
}

export default function ComplaintPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: user?.email || "",
    subject: "",
    description: "",
    type: "",
  });

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(attachment);
    setAttachmentPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [attachment]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSubmitNotice("");
  };

  const selectImage = (file) => {
    if (!file) return;
    const error = validateImage(file);
    setAttachmentError(error);
    setAttachment(error ? null : file);
    setSubmitNotice("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (attachmentError) return;
    setIsSubmitting(true);
    setSubmitNotice("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (attachment) payload.append("attachment", attachment);
      const response = await API.post("/complaints", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage(response.data.message || "Pengaduan berhasil dikirim.");
      setForm({ email: user?.email || "", subject: "", description: "", type: "" });
      setAttachment(null);
    } catch (error) {
      setSubmitNotice(error.response?.data?.message || "Pengaduan gagal dikirim. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-['Poppins',sans-serif] text-[#1b1f3b]">
      {/* TOP BAR */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img
              src={nollaMain}
              alt=""
              aria-hidden="true"
              className="h-8 w-auto object-contain"
            />
            <span className="font-heading text-lg font-semibold">NOLLA</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 sm:text-sm"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* HERO */}
        <div className="mb-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 sm:mb-6 sm:p-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <LifeBuoy aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-blue-600">
            INFORMASI NOLLA
          </p>
          <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Bantuan &amp; Pengaduan
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            Ceritakan kendala yang kamu alami. Sertakan detail yang cukup agar
            tim kami dapat memahami dan menangani masalahnya.
          </p>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          {/* TIPS (kiri) */}
          <section className={`${cardClassName} lg:top-6`}>
            <h2 className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">
              Agar laporan cepat ditangani
            </h2>
            <ul className="space-y-2.5">
              {TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2 text-[13px] leading-6 text-slate-600 sm:text-sm"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-blue-600"
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
              <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Lampirkan tangkapan layar agar tim kami lebih mudah memahami
                kendala yang kamu alami.
              </span>
            </div>
          </section>

          {/* FORM (kanan) */}
          <section className={cardClassName}>
            <h2 className="mb-4 text-base font-semibold text-slate-900 sm:text-lg">
              Formulir pengaduan
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="complaint-email" className={labelClassName}>
                    Alamat email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="complaint-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={updateField}
                    placeholder="nama@email.com"
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="complaint-type" className={labelClassName}>
                    Jenis masalah <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="complaint-type"
                    name="type"
                    required
                    value={form.type}
                    onChange={updateField}
                    className={`${fieldClassName} cursor-pointer`}
                  >
                    <option value="" disabled>
                      Pilih jenis masalah
                    </option>
                    {ISSUE_TYPES.map((issueType) => (
                      <option key={issueType} value={issueType}>
                        {issueType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="complaint-subject" className={labelClassName}>
                  Subjek <span className="text-red-500">*</span>
                </label>
                <input
                  id="complaint-subject"
                  name="subject"
                  type="text"
                  required
                  minLength={4}
                  maxLength={120}
                  value={form.subject}
                  onChange={updateField}
                  placeholder="Ringkas masalah yang kamu alami"
                  className={fieldClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="complaint-description"
                  className={labelClassName}
                >
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="complaint-description"
                  name="description"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  value={form.description}
                  onChange={updateField}
                  placeholder="Jelaskan langkah yang dilakukan dan apa yang terjadi..."
                  className={`${fieldClassName} min-h-32 resize-y`}
                />
                <p className="mt-1 text-right text-[11px] text-slate-500">
                  {form.description.length}/2000
                </p>
              </div>

              <div>
                <span className={labelClassName}>
                  Lampiran{" "}
                  <span className="font-normal text-slate-500">(opsional)</span>
                </span>
                <input
                  ref={fileInputRef}
                  id="complaint-attachment"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => selectImage(event.target.files?.[0])}
                />
                <label
                  htmlFor="complaint-attachment"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    selectImage(event.dataTransfer.files?.[0]);
                  }}
                  className="mt-1.5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 text-center transition hover:border-blue-300 hover:bg-blue-50/60 focus-within:ring-4 focus-within:ring-blue-100"
                >
                  <ImagePlus aria-hidden="true" className="mb-1 h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Pilih gambar atau jatuhkan di sini
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    PNG, JPG, WEBP · Maksimal 5 MB
                  </span>
                </label>

                {attachment && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {attachmentPreview && (
                      <img
                        src={attachmentPreview}
                        alt={`Pratinjau lampiran ${attachment.name}`}
                        className="max-h-80 w-full bg-slate-50 object-contain"
                      />
                    )}
                    <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                      <span className="min-w-0 truncate font-medium text-slate-900">
                        {attachment.name}
                        <span className="ml-1 font-normal text-slate-500">
                          ({(attachment.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        aria-label="Hapus lampiran"
                        className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                {attachmentError && (
                  <p role="alert" className="mt-2 text-xs font-medium text-red-500">
                    {attachmentError}
                  </p>
                )}
              </div>

              {submitNotice && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-xs leading-relaxed text-blue-900"
                >
                  <Info
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>{submitNotice}</span>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:text-sm"
                >
                  <Send aria-hidden="true" className="h-4 w-4" />
                  {isSubmitting ? "Mengirim..." : "Kirim Pengaduan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        © 2026 NOLLA. Hak cipta dilindungi.
      </footer>

      {successMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSuccessMessage("");
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-success-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 aria-hidden="true" className="h-8 w-8" />
            </div>
            <h2 id="complaint-success-title" className="text-xl font-bold text-slate-900">
              Pengaduan terkirim
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {successMessage}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setSuccessMessage("")}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Mengerti
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
