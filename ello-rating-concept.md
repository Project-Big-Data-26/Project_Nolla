## Metode Perhitungan Proficiency: Elo Rating System 1. Keputusan Metode

Proficiency siswa pada aplikasi ini dihitung menggunakan Elo Rating System sejak awal peluncuran, tanpa melalui tahap perantara berbasis aturan statis (rule-based tier scoring). Keputusan ini diambil karena Elo bersifat self-calibrating rating soal dan siswa terus menyesuaikan diri secara otomatis berdasarkan data interaksi riil, tanpa memerlukan proses kalibrasi manual berulang seiring bertambahnya soal maupun pengguna. Untuk skala pengembangan aplikasi ini, penerapan langsung dinilai lebih efisien dibanding menjalankan dua sistem penilaian secara paralel (shadow deployment), karena risiko utama dari pendekatan langsung — yaitu ketidakstabilan rating soal baru akibat data yang masih minim (cold start problem) — dapat dimitigasi melalui mekanisme peredaman (damping) pada konstanta pembelajaran, tanpa perlu menambah kompleksitas arsitektur sistem.

- 2. Prinsip Dasar: Proficiency Bersifat Independen per Materi

Setiap siswa memiliki rating Elo yang terpisah untuk setiap materi, dan idealnya untuk setiap submateri. Tidak terdapat satu nilai rating tunggal yang merepresentasikan kemampuan siswa secara global di seluruh mata pelajaran. Kemampuan siswa pada materi Trigonometri, misalnya, tidak pernah dijadikan acuan untuk menilai kemampuannya pada materi Kalkulus, meskipun kedua materi tersebut mungkin saling terhubung melalui relasi prasyarat. Relasi antar materi direpresentasikan melalui mekanisme gating , bukan melalui penyamaan nilai rating.

- 3. Formula Elo yang Digunakan

Expected Score (probabilitas siswa menjawab benar): E = 1 / (1 + 10^((R_soal - R_siswa) / 400))

Update rating siswa setelah menjawab: R_siswa_baru = R_siswa + K_siswa × (S - E)

Update rating soal (arah sebaliknya): R_soal_baru = R_soal + K_soal_efektif × ((1 - S) - (1 - E))

Keterangan:

- R_siswa — rating kemampuan siswa saat ini pada materi/submateri terkait

- R_soal — rating kesulitan soal saat ini

- S — skor aktual (1 jika jawaban benar, 0 jika salah)

- E — probabilitas siswa menjawab benar berdasarkan selisih rating

- K_siswa, K_soal_efektif — konstanta laju perubahan rating, dijelaskan pada bagian berikut

## 4. Nilai Rating Awal (Baseline)

Penentuan nilai rating awal dirancang agar hubungan antar level kesulitan konsisten secara matematis dan selaras dengan sifat logaritmik formula Elo, di mana selisih rating sebesar 400 poin selalu merepresentasikan rasio peluang menang 10:1, tidak bergantung pada posisi absolutnya di skala.

Batas klasifikasi level soal yang konsisten untuk sistem ini adalah:

- Easy: 0 - 599
- Medium: 600 - 1199
- Hard: 1200+

Rating awal siswa baru : 1000 (berlaku sama untuk setiap materi/submateri, dihitung independen satu sama lain)

- Dengan pemberian rating default per soal :

- Rating default soal Easy : 500

- Rating default soal Medium : 1000

- Rating default soal Hard : 1400

Rating soal level Medium sengaja disamakan dengan rating awal siswa baru (1000), karena secara definisi, soal berkategori "sedang" seharusnya memberikan peluang menjawab benar sebesar 50% bagi siswa dengan kemampuan rata-rata yang baru memulai. Konsistensi ini dapat diverifikasi melalui perhitungan expected score untuk siswa baru terhadap masing-masing level soal:

| Level  | Rating | Expected  | Interpretasi                      |
| ------ | ------ | --------- | --------------------------------- |
| Soal   | Soal   | Score (E) |                                   |
| Easy   | 500    | ≈ 95%     | Peluang tinggi menjawab benar,    |
|        |        |           | sesuai kategori "mudah"           |
| Medium | 1000   | 50%       | Peluang seimbang, sesuai kategori |
|        |        |           | "sedang"                          |
| Hard   | 1400   | ≈ 9%      | Peluang rendah bagi siswa baru,   |
|        |        |           | sesuai kategori "sulit"           |

## 5. Mitigasi Cold Start: Damping pada Rating Soal

Karena rating soal baru pada awalnya hanya berdasarkan estimasi manual (label Easy/Medium/Hard dari tim penyusun), sementara jumlah percobaan riil terhadap soal tersebut masih sangat sedikit, diperlukan mekanisme untuk mencegah rating soal berubah drastis akibat sampel data yang belum representatif. Solusinya adalah membedakan konstanta pembelajaran antara rating siswa dan rating soal :

```
K_siswa = 24 (konstan, tidak berubah)
K_soal_efektif = K_soal / sqrt(jumlah_percobaan_soal + 1)
di mana K_soal = 8
```

Rating siswa sengaja dibuat lebih responsif (K_siswa tetap besar) karena tujuannya adalah personalisasi secepat mungkin terhadap kemampuan individu, sehingga sistem dapat segera menyesuaikan meskipun siswa baru mengerjakan sedikit soal. Sebaliknya, rating soal digunakan bersama oleh seluruh siswa yang mengerjakannya, sehingga pergerakannya diredam berdasarkan jumlah percobaan yang sudah terkumpul — semakin sering soal tersebut dikerjakan, semakin kecil pengaruh satu jawaban baru terhadap rating soal tersebut, dan rating menjadi semakin stabil serta dapat dipercaya. Contoh ilustrasi peredaman:

```
Percobaan pertama pada soal baru (jumlah_percobaan = 0 » 1):
K_efektif = 8 / v1 = 8 2 rating masih cukup reaktif
Setelah 50 percobaan (jumlah_percobaan = 50):
K_efektif = 8 / v51 = 1.1 2 rating mendekati stabil
satu jawaban baru nyaris tidak menggeser rating
soal
```

## 6. Penerapan pada Skema Branching Pretest

Sesuai struktur pretest yang telah ditetapkan (2 soal fixed per submateri dengan branching level kedua), rating soal ke-2 turut mengikuti baseline di atas:

```
Soal 1: selalu level Medium (rating 1000)
Soal 2:
JIKA Soal 1 dijawab BENAR → level Hard (rating 1400)
```

JIKA Soal 1 dijawab SALAH → level Easy (rating 500)

Pendekatan branching ini secara alami memperkuat kualitas estimasi Elo, karena soal kedua yang diberikan sudah mendekati level kemampuan siswa berdasarkan jawaban soal pertama, membuat nilai expected score (E) lebih presisi dan pembaruan rating menjadi lebih informatif dibandingkan jika kedua soal memiliki level yang sama secara statis.

## 7. Prinsip Kepemilikan Rating: Materi Asal Soal, Bukan Materi yang Sedang Dites

Untuk soal yang disisipkan sebagai prerequisite check (soal dari materi prasyarat langsung, ditempatkan di awal sesi pretest suatu materi baru), pembaruan rating selalu merujuk pada materi asal soal tersebut, bukan pada materi yang sedang menjadi subjek pretest. Sebagai contoh, soal Aljabar yang disisipkan dalam sesi pretest Trigonometri akan memperbarui rating siswa pada materi Aljabar, bukan rating pada materi Trigonometri. Prinsip ini menjaga agar setiap rating tetap murni merepresentasikan kemampuan siswa pada materi aslinya, sekaligus memungkinkan satu soal prasyarat yang disisipkan di berbagai materi turunan untuk terus memperbarui dan memvalidasi kesiapan siswa pada materi prasyarat tersebut secara berkelanjutan.

`

## 8. Ringkasan Parameter Final

Rating awal siswa baru

Rating default soal Easy

Rating default soal Medium : 1000

Rating default soal Hard : 1400

Batas level soal: Easy 0-599 | Medium 600-1199 | Hard 1200+

K_siswa

K_soal_efektif

Skema branching soal ke-2 : Benar → Hard (1400) | Salah → Easy (500)

Kepemilikan update rating : selalu merujuk ke materi_asal_soal,

bukan materi_yang_sedang_dites

: 1000 (per materi/submateri, independen)

: 600

: 24 (fixed)

: 8 / sqrt(jumlah_percobaan_soal + 1)
