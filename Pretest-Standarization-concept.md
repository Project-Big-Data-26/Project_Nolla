## Standarisasi Pretest Adaptif Per-Materi

## 1. Latar Belakang & Tujuan

Pretest pada aplikasi ini diterapkan dengan skema per-materi, bukan per-jenjang. Setiap kali siswa hendak mempelajari suatu materi baru, sistem menyajikan sesi pretest singkat untuk:

- 1. Mengukur proficiency awal siswa terhadap materi tersebut, secara granular hingga level submateri.

- 2. Memvalidasi kesiapan siswa berdasarkan penguasaan materi prasyaratnya.

- 3. Menentukan starting point kesulitan soal pada fase latihan setelah pretest.

- 4. Menjadi bagian dari mekanisme gating (pembuka kunci) materi lanjutan yang bergantung padanya.

Prinsip utama yang mendasari desain ini:

- Proficiency bersifat per-materi , tidak ada rating tunggal/global milik siswa yang dipakai lintas materi.

- Pretest harus efisien jumlah soal proporsional terhadap cakupan materi, tidak membebani siswa.

- Sistem bersifat self-calibrating kesulitan soal dan kemampuan siswa terus diperbarui dari data historis, bukan statis.

## 2. Struktur Umum Pretest

Setiap sesi pretest satu materi terdiri dari 3 tahap:

| Tahap | Nama       | Fungsi                        | Jumlah Soal               |
| ----- | ---------- | ----------------------------- | ------------------------- |
|       | Prerequisi | Validasi kesiapan             | 1 soal × jumlah prasyarat |
| 0     | te Check   | berdasarkan materi            | langsung (cap maksimum    |
|       |            | prasyarat langsung            | jika terlalu banyak)      |
|       | Screening  | Estimasi kasar proficiency di | 1 soal medium × jumlah    |
| 1     | Submateri  | tiap submateri materi yang    | submateri                 |
|       |            | dites                         |                           |

Total soal per sesi pretest: dinamis, tergantung jumlah prasyarat langsung dan jumlah submateri materi tsb — bukan angka tetap untuk semua materi.

| Kompleksitas Materi            | Estimasi Total Soal |
| ------------------------------ | ------------------- |
| Tanpa prasyarat, 2-3 submateri | 4–6 soal            |
| 1-2 prasyarat, 4-5 submateri   | 8–12 soal           |

## 3. Aturan Tahap 0 — Prerequisite Check

- Sumber soal: diambil dari bank soal materi prasyarat langsung, level kesulitan medium, tidak spesifik ke 1 submateri tertentu dari materi prasyarat tsb.

- Jumlah: 1 soal per materi prasyarat langsung. Jika jumlah prasyarat langsung lebih dari 3, terapkan cap (misal maksimum 3 soal), dengan prioritas: materi prasyarat dengan proficiency histori terendah atau paling lama tidak disentuh siswa didahulukan.

- Materi tanpa prasyarat (materi pembuka jenjang) otomatis tidak memiliki Tahap 0.

- Kepemilikan data: jawaban soal Tahap 0 meng-update rating proficiency milik materi asal soal, bukan materi yang sedang dites. Soal Aljabar yang disisipkan di pretest Trigonometri tetap meng-update rating_Aljabar siswa.

- Efek terhadap gating: karena rating materi prasyarat ikut ter-update real-time, hasil Tahap 0 otomatis memengaruhi status gating ke materi lain yang juga membutuhkan prasyarat yang sama — bukan cuma memengaruhi materi yang sedang dites.

- Sifat non-blocking: jawaban salah di Tahap 0 tidak menghentikan pretest (soft gate), namun menurunkan starting difficulty submateri terkait dan memicu rekomendasi remedial pasca-pretest.

## 4. Aturan Tahap 1 — Submateri Materi yang Dites

- Tahap 1: setiap submateri diwakili 1 soal level medium dan 1 soal easy / hard berdasarkan hasil pengguna pada pengerjaan soal pertama, dikerjakan berurutan.

## 5. Metode Perhitungan Proficiency

Struktur data proficiency: setiap siswa memiliki rating terpisah per materi (idealnya per submateri), disimpan sebagai ProficiencySiswa(user_id, materi_id, submateri_id, rating) — tidak ada rating global lintas materi.

## Metode yang direkomendasikan :

| Metode            | Alasan                                     |
| ----------------- | ------------------------------------------ |
| Elo Rating System | Self-calibrating, ringan secara komputasi, |
|                   | cocok untuk skala aplikasi                 |

## Formula Elo (ringkasan):

```
E=1/ (1+ - R_siswa) / 400))
R_siswa_baru = R_siswa + K x (S - E)
```

- S = 1 jika benar, 0 jika salah; K = konstanta pembelajaran (16-32).

- 6. Algoritma Pembobotan Kesulitan Soal (Berbasis Data Historis)

```
Difficulty_Index = 1 - (Jumlah_Jawaban_Benar / Jumlah_Total_Percobaan)
= (n x Difficulty_Index + m x Difficulty Default) / (n + m)
n =jumlah percobaan aktual, m = pseudo-count (misal 20) agar soal baru tidak langsung ekstrem karena sampel kecil, Difficulty Default awal dari tim penyusun.
```

## 7. Contoh Penerapan Lengkap — Materi "Trigonometri" (SMA, Kelas 10) 7.1 Posisi dalam Peta Prasyarat

Prasyarat langsung: Aljabar & Fungsi Dasar, Geometri Bangun Datar (2 materi).

## 7.2 Submateri Trigonometri

| Kode | Submateri | Level Dasar |
| ---- | --------- | ----------- |

| S1  | Perbandingan Trigonometri Segitiga | Medium |
| --- | ---------------------------------- | ------ |
|     | Siku-siku                          |        |
| S2  | Sudut Istimewa                     | Medium |
| S3  | Identitas Trigonometri Dasar       | Medium |
| S4  | Trigonometri di Berbagai Kuadran   | Medium |

## 7.3 Gerbang Prasyarat

- Akses ke pretest Trigonometri: selalu terbuka (soft gate) Namun jika: rating_Aljabar < threshold ATAU rating_Geometri < threshold → muncul notifikasi peringatan sebelum siswa mulai pretest, siswa tetap bisa lanjut

## 7.4 Struktur Soal Pretest

## Tahap 0 — Prerequisite Check (2 soal):

| N          | Materi Asal  | Soal                                   | Target Update  |
| ---------- | ------------ | -------------------------------------- | -------------- |
| o          |              |                                        | Rating         |
| 1 Aljabar  | &            | Jika 2x = 10, tentukan nilai x.        | rating_Aljabar |
|            | Fungsi Dasar |                                        | siswa          |
| 2 Geometri |              | Segitiga siku-siku, sisi tegak 6, sisi | rating_Geomet  |
|            | Bangun       | datar 8. Tentukan sisi miring.         | ri siswa       |
|            | Datar        |                                        |                |

## Tahap 1 — Screening (4 soal, 1 per submateri):

Soal 1: selalu level Medium

JIKA Soal 1 dijawab BENAR → Soal 2: level Hard JIKA Soal 1 dijawab SALAH → Soal 2: level Easy

| Submateri | Soal 1 (Medium, | Soal 2 jika  | Soal 2 jika Soal 1 Salah |
| --------- | --------------- | ------------ | ------------------------ |
|           | fixed)          | Soal 1 Benar | (Easy)                   |
|           |                 | (Hard)       |                          |

| S1  | Segitiga siku-siku | Segitiga        | Pada segitiga siku-siku, sisi |
| --- | ------------------ | --------------- | ----------------------------- |
|     | sisi depan 3, sisi | siku-siku sisi  | depan = 1, sisi samping = 1.  |
|     | samping 4.         | depan 5, sisi   | Tentukan sin sudutnya.        |
|     | Tentukan sin       | miring          | 13.                           |
|     | sudut tsb.         | Tentukan cos    |                               |
|     |                    | dan tan sudut   |                               |
|     |                    | tsb sekaligus.  |                               |
| S2  | Tentukan nilai     | Tentukan nilai  | Tentukan nilai sin 90°.       |
|     | cos 60° + sin 30°. | (sin 45° × cos  |                               |
|     |                    | 30°) − (cos 45° |                               |
|     |                    | × sin 30°).     |                               |
| S3  | Sederhanakan       | Buktikan        | Jika sin x = 0.6, tentukan    |
|     | sin²x + cos²x.     | bahwa 1 +       | nilai cos x menggunakan       |
|     |                    | tan²x = sec²x.  | identitas sin²x + cos²x = 1.  |
| S4  | Tentukan tanda     | Tentukan        | Sebutkan kuadran berapa       |
|     | (positif/negatif)  | tanda dari sin, | sudut 150° berada.            |
|     | dari sin 150°.     | cos, dan tan    |                               |
|     |                    | sekaligus       |                               |
|     |                    | untuk sudut     |                               |
|     |                    | 210°.           |                               |

## 7.5 7.5 Skema Bank Soal yang Dibutuhkan

1 soal Medium (soal 1, dipakai semua siswa) 1 soal Hard (soal 2, jika soal 1 benar) 1 soal Easy (soal 2, jika soal 1 salah) → 3 varian soal × 4 submateri = 12 soal wajib tersedia di bank soal Trigonometri (di luar 2 soal Tahap 0 yang diambil dari bank soal Aljabar & Geometri)

## 7.6 Contoh Alur Update Rating

```
Soal 1 (Tahap 0, asal: Aljabar) → Benar → update rating_Aljabar siswa
Soal 2 (Tahap 0, asal: Geometri) → Salah → update rating_Geometri
siswa
Soal 3 (Tahap 1, S1) → Benar → update rating_Trigonometri_S1
Soal 4 (Tahap 1, S2) → Benar → update rating_Trigonometri_S2
Soal 5 (Tahap 1, S3) → Salah → update rating_Trigonometri_S3
Soal 6 (Tahap 1, S4) → Salah → update rating_Trigonometri_S4
Soal 7 (Tahap 2, S2 lanjutan) → ... → update rating_Trigonometri_S2
Soal 8 (Tahap 2, S3 lanjutan) → ... → update rating_Trigonometri_S3
```

## 7.7 Perhitungan Proficiency (Contoh dengan Elo Rating)

Asumsi rating awal siswa di tiap submateri (siswa baru): R = 1000. Rating soal berdasarkan level:

| Level  | Rating Soal |
| ------ | ----------- |
| Easy   | 800         |
| Medium | 1000        |
| Hard   | 1200        |

Catatan: K = 24.

## Submateri S1 (No. 3 & 4):

Soal 2 (Hard, R_soal=1200), Salah: E = 1/(1+10^((1200-1012)/400)) ≈ 0.30 R_S1 = 1012 + 24×(0-0.30) ≈ 1005

→ Hasil akhir S1 ≈ 1005 (setara ~51% pada skala 0-100 dgn baseline 1000=50%) — proficiency sedang, karena meski Medium benar, Hard-nya gagal → wajar mencerminkan kemampuan pas-pasan di level lanjut.

Submateri S3 (No. 7 & 8):

- Hasil akhir S3 ≈ 995 (~49%) — proficiency rendah-menengah, konsisten dengan siswa yang gagal di Medium tapi masih bisa Easy. (Perhitungan S2 dan S4 mengikuti pola rumus yang sama.)

_7.8 Hasil Akhir & Dampak_

| Output                | Nilai/Status                                   |
| --------------------- | ---------------------------------------------- |
| rating_Aljabar siswa  | Naik (Tahap 0 No.1 benar)                      |
| rating_Geometri siswa | Turun (Tahap 0 No.2 salah) → notifikasi        |
|                       | rekomendasi review Pythagoras                  |
| Proficiency S1        | ~51% → sedang, unlocked mulai level menengah   |
| Proficiency S2        | Tinggi (Medium & Hard benar) → unlocked, mulai |
|                       | level lanjut                                   |
| Proficiency S3        | ~49% → sedang-rendah, unlocked tapi            |
|                       | direkomendasikan pengantar                     |
| Proficiency S4        | Rendah (Medium & Easy salah) → soft-locked,    |
|                       | rekomendasi kuasai S1-S3 dulu                  |

| Proficiency             | ~50%                                             |
| ----------------------- | ------------------------------------------------ |
| Trigonometri            |                                                  |
| keseluruhan (rata-rata  |                                                  |
| submateri)              |                                                  |
| Status gating ke materi | Soft-locked (di bawah threshold 60%)             |
| K11                     |                                                  |
| Efek ke materi lain     | rating_Geometri yang turun ikut memengaruhi      |
|                         | gating ke materi lain yang butuh Geometri        |
|                         | (misal materi K11 lain yang juga punya prasyarat |
|                         | Geometri)                                        |
