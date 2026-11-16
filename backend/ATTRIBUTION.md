# First-touch visit attribution

## URL UTM

Analytics mencatat satu first-touch per browser dengan ID acak `visit_id`. Nilai
UTM dari kunjungan pertama disimpan dan tidak diganti saat halaman berikutnya
dibuka atau saat pengguna kembali dari sumber promosi lain.

| Kanal | `utm_source` | `utm_medium` |
| --- | --- | --- |
| WhatsApp jarkoman | `whatsapp` | `broadcast` |
| Instagram Story | `instagram` | `story` |
| Instagram Feed | `instagram` | `feed` |
| TikTok Story | `tiktok` | `story` |
| Postingan TikTok | `tiktok` | `post` |
| Poster sekolah (QR) | `school_visit` | `poster_qr` |

`utm_content` saat ini hanya menerima `poster` atau `video`. `utm_campaign`
yang diterima adalah `promosi_nolla`. Parameter yang hilang sebagian atau
kombinasi source-medium yang tidak dikenal ditolak, bukan ditebak.

Tanpa UTM, server menyimpan `direct` hanya bila browser tidak mengirim referrer;
jika ada referrer, sumber menjadi `unknown`. URL/referrer tidak disimpan.

Setiap sekolah wajib memakai `placement_id` unik yang telah didaftarkan pada
`ATTRIBUTION_PLACEMENTS_JSON`. Contoh:

```text
https://nolla.id/?utm_source=school_visit&utm_medium=poster_qr&utm_campaign=promosi_nolla&utm_content=poster&placement_id=smpn_01_bandung
https://nolla.id/?utm_source=school_visit&utm_medium=poster_qr&utm_campaign=promosi_nolla&utm_content=poster&placement_id=smpn_02_bandung
```

Konfigurasikan kode dan nama sekolah di `backend/.env`, misalnya:

```dotenv
ATTRIBUTION_PLACEMENTS_JSON={"smpn_01_bandung":"SMPN 1 Bandung","smpn_02_bandung":"SMPN 2 Bandung"}
```

Untuk poster, tautan pendek `/go/<placement_id>` mengalihkan (HTTP 302) ke URL
panjang dengan UTM di atas. Backend hanya mengalihkan kode yang terdaftar;
placement tak dikenal atau typo dialihkan ke beranda domain tanpa parameter UTM
atau atribusi sekolah. Kode yang tidak valid tidak ditebak agar laporan sekolah
tidak salah. Nginx frontend meneruskan `/go/` ke backend. Tautan UTM panjang
tetap didukung langsung.

`placement_id` menunjukkan lokasi poster yang tautannya dipakai, bukan lokasi
pengunjung. Kode placement disimpan bersama first-touch dan nama sekolah
ditambahkan dari konfigurasi pada laporan. Wilayah pengunjung tidak disimpulkan
dari kode placement maupun alamat IP.

## Wilayah dan alamat IP

Atribusi hanya memakai parameter tautan UTM dan `placement_id` yang tervalidasi.
Backend tidak melakukan lookup GeoIP, tidak membaca header IP untuk atribusi,
dan tidak menyimpan wilayah pengunjung pada dokumen attribution. Tidak
diperlukan database GeoIP maupun konfigurasi CIDR proxy untuk fitur ini. Log
infrastruktur di luar koleksi attribution tetap dikelola terpisah oleh operator.

## Data, retensi, dan laporan

Dokumen `visit_attributions` hanya memuat source, medium, campaign, content,
placement, waktu, ID kunjungan acak, ID analytics pseudonim (bila
registrasi berhasil), status/waktu konversi, dan waktu kedaluwarsa. IP mentah,
referrer, URL, email, dan nama akun tidak disimpan di koleksi ini. Tautan ke
akun memakai ID analytics pseudonim yang sama seperti sistem analytics saat
ini. Konversi registration, quiz start, dan quiz completion hanya dicatat satu
kali per first-touch. ID first-touch di browser juga memiliki kedaluwarsa;
server mengirim waktu kedaluwarsa dokumen dan browser membuat ID baru setelah
masa retensi berakhir. Browser lama tanpa metadata kedaluwarsa memulai ID baru.

`ANALYTICS_RETENTION_DAYS` berlaku untuk event analytics dan atribusi, default
365 hari dan nilai konfigurasi minimal 365 hari. TTL MongoDB menghapus dokumen
rinci setelah masa tersebut; TTL MongoDB berjalan periodik, bukan tepat pada
detik kedaluwarsa. Setel nilainya
sesuai kebijakan retensi yang disepakati sebelum mengaktifkan analytics. Periksa
retensi backup dan log deployment secara terpisah.

Jika database pernah memakai versi attribution yang menyimpan field `region`,
hapus field lama pada database staging sebelum menguji versi ini:

```javascript
db.visit_attributions.updateMany({}, { $unset: { region: "" } });
```

Laporan agregat tersedia di `GET /api/analytics/attribution/report?from=<ISO>&to=<ISO>`
dengan `from` inklusif, `to` eksklusif, dan rentang maksimal 366 hari. Endpoint memerlukan access token valid dan
role Developer atau Project Manager yang diizinkan. Model pengguna saat ini
hanya memiliki role Siswa, Guru, dan Admin; karena itu akses laporan ditolak
secara default. Jangan mengatur `ATTRIBUTION_REPORT_ROLES` sampai role target
ditambahkan ke skema/proses provisioning dan ditetapkan melalui mekanisme
otorisasi proyek. Konfigurasi hanya menerima nama `Developer` dan `Project Manager`;
Admin tidak otomatis memperoleh akses. Endpoint ini tidak publik.

## Pemberitahuan privasi

Kebijakan privasi frontend menjelaskan penggunaan sumber tautan untuk analytics,
klasifikasi direct/unknown, arti placement sekolah, dan bahwa atribusi tidak
memperkirakan wilayah dari IP. Pemrosesan kunjungan berjalan hanya bila
`ANALYTICS_ENABLED=true`. Produk saat ini tidak meminta GPS. Analytics dinonaktifkan
secara default pada `.env.example`; tetapkan dasar pemrosesan yang sesuai
sebelum mengaktifkannya, khususnya untuk pengguna anak.

## Pengujian

### Checklist deployment staging

- [ ] Gunakan backend dan database **staging yang terpisah dari produksi**.
      `APP_ENV=staging` juga mengaktifkan `/api/staging` tanpa login.
- [ ] Atur `ANALYTICS_ENABLED=true` hanya pada environment staging, dan
      `ANALYTICS_ENVIRONMENT=staging`. Jangan ubah secret/env produksi.
- [ ] Isi `ATTRIBUTION_PLACEMENTS_JSON` dengan kode sekolah yang disetujui.
- [ ] Set `ANALYTICS_RETENTION_DAYS=365` atau nilai yang lebih tinggi sesuai
      kebijakan. Pastikan TTL MongoDB aktif pada `visit_attributions` dan
      `analytics_events`.
- [ ] Rebuild/deploy frontend agar aturan Nginx `/go/` yang baru aktif, lalu
      pastikan konfigurasi Nginx mengarahkan `/go/` ke backend.
- [ ] Uji `/go/smpn_01_bandung`: harus mendapat 302 ke URL UTM dengan kode
      placement tersebut. Uji kode yang tidak didaftarkan atau typo: harus
      mendapat 302 ke beranda tanpa parameter UTM atau atribusi sekolah.
      Pastikan URL UTM panjang tetap langsung membuka halaman tujuan.
- [ ] Buka tautan ber-UTM sebagai pengunjung anonim. Navigasi beberapa halaman
      lalu coba UTM lain; record harus tetap memuat source/medium/content/
      placement first-touch pertama. Kunjungan tanpa UTM harus berstatus direct
      bila tidak ada referrer, dan unknown bila referrer ada.
- [ ] Daftarkan akun uji baru dari kunjungan tersebut. Pastikan conversion
      registration tercatat dan hanya ID analytics pseudonim (bukan email/nama)
      menghubungkan akun dengan atribusi.
- [ ] Mulai dan selesaikan kuis dari akun uji. Periksa conversion kuis mulai
      dan selesai; retry tidak boleh menggandakan waktu konversi.
- [ ] Pastikan atribusi tidak menyimpan wilayah/IP; perbandingan sekolah
      menggunakan `placement_id`, bukan perkiraan lokasi pengunjung.
- [ ] Endpoint laporan harus 401 tanpa token dan 403 untuk semua role yang
      belum dikonfigurasi. Saat role Developer/Project Manager resmi tersedia,
      uji dua role tersebut serta pastikan Admin/Siswa tetap 403 kecuali akses
      Admin disetujui melalui perubahan otorisasi tersendiri. Jangan membuat
      endpoint laporan publik.
- [ ] Buka kebijakan privasi staging dan pastikan penjelasan UTM, placement,
      tidak adanya perkiraan wilayah dari IP, dan retensi sesuai konfigurasi.

Backend unit tests (tanpa koneksi MongoDB):

```powershell
cd backend
node --test test/attributionService.test.js test/attributionController.test.js test/placementRedirect.test.js
```

Frontend analytics test:

```powershell
cd frontend
npm test -- --run src/analytics/client.test.js
```

Tes mencakup parsing kanal UTM, direct/unknown, first-touch yang tidak ditimpa,
kunjungan anonim sebelum login, placement ID terdaftar, link pseudonim saat
registrasi, tidak menyimpan wilayah/IP, gate role laporan, serta hitungan agregat
konversi per placement sekolah. Untuk uji end-to-end deployment, aktifkan
analytics hanya pada database uji, daftarkan dua placement, dan gunakan URL QR
yang berbeda; jangan mempublikasikan endpoint laporan.

Saat ini suite backend penuh juga memiliki kegagalan baseline di
`migrateImagesToCloudinary.test.js` (`parseCheckpointContents` tidak terdefinisi);
ini terpisah dari tes attribution dan short-link di atas.
