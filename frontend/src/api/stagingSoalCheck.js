import API from "./axios";

// Pintu cek soal khusus staging. Kontrak backend: docs/perbaikan-frontend.md (FE-09).
// Endpoint hanya ada bila backend APP_ENV=staging; di environment lain 404.
export const CHECK_PAGES = { question: "question", review: "review" };

const CHECK_ROUTES = {
  question: "/staging/cek-soal",
  review: "/staging/cek-soal/review",
};

// Filter pintu 1 (per halaman): review=1 sudah diberi aksi / 0 belum;
// aprove=1 tampil benar / 0 rusak. Nilai selain "0"/"1" diabaikan.
const readFlag = (value) => (value === "0" || value === "1" ? value : null);

export const hasCheckFilter = ({ review, aprove } = {}) => review !== null || aprove !== null;

// Pintu 1: ?subbabId=...  Pintu 2: ?soalId=...
// n = nomor dalam daftar (mulai 1); at = soal_id yang dibuka (dipakai saat pindah
// halaman soal <-> review, karena daftar terfilter kedua halaman bisa berbeda).
export const buildCheckUrl = (
  page,
  { subbabId, soalId, number, at, review = null, aprove = null } = {},
) => {
  const query = new URLSearchParams();
  if (soalId) query.set("soalId", soalId);
  else if (subbabId) {
    query.set("subbabId", subbabId);
    if (review !== null) query.set("review", review);
    if (aprove !== null) query.set("aprove", aprove);
  }
  if (at) query.set("at", at);
  else if (number > 1) query.set("n", String(number));
  const search = query.toString();
  return `${CHECK_ROUTES[page]}${search ? `?${search}` : ""}`;
};

export const readCheckTarget = (searchParams) => ({
  subbabId: searchParams.get("subbabId") || null,
  soalId: searchParams.get("soalId") || null,
  number: Math.max(1, Number.parseInt(searchParams.get("n"), 10) || 1),
  at: searchParams.get("at") || null,
  review: readFlag(searchParams.get("review")),
  aprove: readFlag(searchParams.get("aprove")),
});

// Indeks awal: soal `at` bila ada di daftar, selain itu nomor `n`.
export const getStartIndex = (items, { at, number }) => {
  const atIndex = at ? items.findIndex((item) => String(item.question_id) === at) : -1;
  if (atIndex >= 0) return atIndex;
  return Math.min(number, items.length) - 1;
};

export const fetchSoalCheckItems = async ({
  subbabId,
  soalId,
  page = "question",
  review = null,
  aprove = null,
}) => {
  if (soalId) {
    const response = await API.get(
      `/staging/soal-check/soal/${encodeURIComponent(soalId)}`,
    );
    return { title: "Cek satu soal", items: [response.data.data.question] };
  }

  if (subbabId) {
    const query = new URLSearchParams();
    if (hasCheckFilter({ review, aprove })) {
      query.set("page", page);
      if (review !== null) query.set("review", review);
      if (aprove !== null) query.set("aprove", aprove);
    }
    const search = query.toString();
    const response = await API.get(
      `/staging/soal-check/subbab/${encodeURIComponent(subbabId)}${search ? `?${search}` : ""}`,
    );
    const data = response.data.data;
    return {
      title: data.subbab_name || "Cek soal subbab",
      items: data.questions || [],
      summary: data.summary ?? null,
    };
  }

  throw new Error("Tambahkan subbabId atau soalId pada URL.");
};

// Kelas -> bab -> subbab (+ soal_count) untuk memilih subbab yang dicek.
export const fetchCheckTree = async () =>
  (await API.get("/staging/soal-check/tree")).data.data.kelas || [];

export const updateSoalCheck = async (soalId, page, value) => {
  const response = await API.patch(
    `/staging/soal-check/soal/${encodeURIComponent(soalId)}`,
    { page, value },
  );
  return response.data.data.question;
};

// Label & status cek dari item backend, dipisah dari bentuk soal yang dirender halaman.
export const toCheckMeta = (item) => ({
  id: String(item.question_id),
  sequence: item.sequence ?? null,
  cognitiveLevel: item.cognitive_level ?? null,
  storedLevel: item.stored_cognitive_level ?? null,
  status: item.status ?? null,
  check: item.check,
});

export const toCheckMetaMap = (items) =>
  Object.fromEntries(items.map((item) => [String(item.question_id), toCheckMeta(item)]));

// 404 tanpa pesan JSON = router staging tidak terpasang (backend bukan APP_ENV=staging).
export const getCheckErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  (error?.response?.status === 404
    ? "Pintu cek soal hanya tersedia bila backend berjalan dengan APP_ENV=staging."
    : error?.message || fallback);
