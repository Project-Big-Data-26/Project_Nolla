# Laporan Temuan Security Testing (Draf)

**Proyek:** project_assessment · **Penguji:** QA · **Metode:** tinjauan kode dan uji API (Postman)

**Status:** F-01 sampai F-04 adalah dugaan dari tinjauan kode. Langkah reproduksi belum dijalankan; kolom "Status" diperbarui setelah diuji.

## Ringkasan

| ID | Temuan | Risiko (usulan) | Status |
|---|---|---|---|
| F-01 | Input `jenjang_id` dimasukkan mentah ke regex | Sedang | Perlu diverifikasi (`PM-PROFIL-023`) |
| F-02 | Login tidak dibatasi percobaannya (brute force) | Sedang | Perlu diverifikasi |
| F-03 | CORS terbuka untuk semua origin | Rendah–Sedang | Terkonfirmasi di kode |
| F-04 | Header keamanan HTTP (`helmet`) tidak ditemukan | Rendah | Terkonfirmasi di kode |
| F-05 | Dependabot belum dikonfigurasi di repo | Info | Perlu dicek di Settings |

Hasil baik: `npm audit` untuk dependency produksi menunjukkan **0 kerentanan** di backend dan frontend.

## Detail

### F-01. Regex dari input pengguna
- **Lokasi:** `backend/controllers/profileController.js:80`, `backend/controllers/personalizationController.js:58`
- **Temuan:** `new RegExp(`^${jenjang_id}$`, "i")` memakai input pengguna tanpa di-escape.
- **Reproduksi:** `PATCH /api/profile` dengan body `{"jenjang_id": ".*"}`.
- **Harapan:** ditolak (4xx), dan jenjang profil tidak berubah.
- **Dampak:** `.*` bisa cocok dengan jenjang apa pun, dan pola regex berat berpotensi membuat server lambat (ReDoS).
- **Saran:** escape karakter regex atau cocokkan dengan nilai pasti (whitelist `SD`/`SMP`/`SMA`).

### F-02. Tidak ada pembatasan percobaan login
- **Lokasi:** `backend/controllers/authController.js`, `backend/index.js`
- **Temuan:** tidak ditemukan rate limiting maupun penguncian akun setelah gagal berulang.
- **Reproduksi:** kirim 20+ `POST /api/auth/login` dengan password salah untuk akun yang sama.
- **Harapan:** setelah beberapa kali gagal, ada pembatasan (HTTP 429 atau penguncian sementara).
- **Saran:** `express-rate-limit` pada `/api/auth/*`.

### F-03. CORS terbuka
- **Lokasi:** `backend/index.js:21` (`app.use(cors())`)
- **Temuan:** semua origin diizinkan.
- **Saran:** batasi ke domain frontend lewat variabel environment.

### F-04. Header keamanan HTTP
- **Temuan:** `helmet` tidak ditemukan di `package.json` maupun `index.js`.
- **Saran:** tambahkan `helmet()`.

### F-05. Pemantauan dependency
- **Temuan:** tidak ada `.github/dependabot.yml` di repo ini.
- **Saran:** aktifkan Dependabot alerts di Settings, atau tambahkan file konfigurasinya.

## Yang sudah diuji dan baik

Cakupan collection Postman (`postman/collections/profil/`): akses tanpa token atau token rusak ditolak; password dan hash tidak muncul di response; field `role` dan `password` yang dikirim ke endpoint profil diperiksa; aturan kekuatan password.
