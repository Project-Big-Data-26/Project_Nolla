## Pipeline Teknis bagaimana Hasil Pretest direpresentasikan oleh Website

Jobdesk ini adalah mencari tahu bagaimana hasil pretest yang dikerjakan

siswa bisa diubah menjadi informasi kemampuan siswa yang kemudian dapat digunakan oleh website.

Jadi disini tidak fokus pada bagaimana soal pretest dibuat atau bagaimana

tampilan soal di frontend, tetapi lebih ke alur data setelah siswa mengerjakan pr1etest sampai hasilnya bisa direpresentasikan kembali di website.

## 1. Memahami Output dari Pretest

Sebelum menentukan bagaimana hasil pretest direpresentasikan menjadi kemampuan siswa, perlu diketahui terlebih dahulu data apa yang dihasilkan dari proses pretest. Berdasarkan konsep yang telah disepakati, pretest dilakukan per materi, sehingga ketika siswa ingin mempelajari suatu materi, siswa akan mengerjakan pretest yang berkaitan dengan materi tersebut. Hasil dari pretest kemudian tidak hanya berupa nilai akhir, tetapi juga menghasilkan data dari setiap soal yang dikerjakan siswa.

Pada database sementara dari Team 2, hasil pengerjaan setiap soal direpresentasikan melalui data question_attempts. Data tersebut mencatat informasi yang berkaitan dengan siswa, soal yang dikerjakan, subtopic soal, jawaban yang dipilih, hasil benar atau salah, tingkat kesulitan soal, waktu pengerjaan, serta waktu pengerjaan tersebut dilakukan.

_Struktur Tabel Database question_attemps_

| Data                           | Keterangan                           |
| ------------------------------ | ------------------------------------ |
| user_id                        | Identitas siswa yang mengerjakan     |
| question_id                    | Identitas soal yang dikerjakan       |
| Subtopic dari soal subtopic_id |                                      |
| selected_answer                | Jawaban yang dipilih siswa           |
| is_correct                     | Menunjukkan jawaban benar atau salah |
| difficulty                     | Tingkat kesulitan soal               |
| response_time                  | Waktu yang digunakan untuk menjawab  |
| attempted_at                   | Waktu pengerjaan                     |

Dari data tersebut, dapat diketahui bahwa output awal dari pretest masih berupa data hasil pengerjaan soal, bukan langsung berupa kemampuan siswa. Data inilah yang kemudian menjadi input untuk proses berikutnya, yaitu menentukan dan memperbarui proficiency siswa berdasarkan materi atau submateri yang berkaitan dengan soal tersebut.

## 2. Menentukan Representasi Kemampuan Siswa

Dari hasil pretest, website membutuhkan suatu bentuk data yang bisa menunjukkan tingkat kemampuan siswa pada materi atau submateri tertentu. Jadi, data jawaban seperti benar/salah saja belum cukup untuk langsung digunakan sebagai representasi kemampuan.

Berdasarkan konsep tim, kemampuan siswa direpresentasikan menggunakan proficiency/rating. Proficiency ini disimpan secara terpisah untuk setiap materi atau submateri, sehingga kemampuan siswa pada satu materi tidak otomatis dianggap sama dengan materi lainnya.

## Contoh:

| Materi           | Proficiency |
| ---------------- | ----------- |
| Persamaan Linear | 1050        |
| Pecahan          | 920         |
| Geometri         | 1120        |

Artinya, satu siswa bisa memiliki rating yang berbeda pada setiap materi karena kemampuan siswa memang dihitung berdasarkan pengerjaan pada materi

tersebut. Berdasarkan penyampaian dari tegar, Kenapa sih kok harus per materi? Misalkan terdapat seorang siswa dengan kecakapan sebagai berikut:

Kalau hanya ada satu proficiency untuk seluruh matematika, kemampuan siswa pada Integral bisa ikut memengaruhi pemberian soal Diferensial. Oleh karenanya, konsep sekarang adalah sebagai berikut:

Dengan begitu, ketika siswa mengerjakan pretest suatu materi, hasilnya digunakan untuk memperbarui proficiency materi/submateri yang berkaitan dengan soal tersebut.

## 3. Proses Perhitungan Proficiency/Rating

Berdasarkan konsep yang sudah dipilih oleh Team 3, perhitungan proficiency menggunakan Elo Rating System. Jadi, setiap siswa memiliki rating awal untuk setiap materi atau submateri, kemudian rating tersebut akan diperbarui berdasarkan hasil pengerjaan soal. Berikut alur sederhananya:

## 4. Penyimpanan Hasil dan Riwayat Jawaban

Setelah proses perhitungan proficiency dilakukan, hasil perhitungan dan data pengerjaan siswa perlu disimpan agar dapat digunakan kembali oleh sistem. Penyimpanan ini mencakup riwayat jawaban siswa dan proficiency terbaru yang telah diperoleh dari proses perhitungan. Berikut alurnya:

## Riwayat jawaban

Riwayat pengerjaan soal menyimpan informasi mengenai bagaimana siswa mengerjakan setiap soal. Pada rancangan database sementara dari Team 2, data tersebut direpresentasikan melalui tabel question_attempts. Data ini nantinya dapat digunakan untuk mengetahui riwayat pengerjaan siswa serta menjadi dasar bagi proses pengolahan data selanjutnya.

## Proficiency siswa

Selain riwayat jawaban, sistem juga perlu menyimpan proficiency terbaru siswa untuk setiap materi atau submateri. Proficiency inilah yang nantinya digunakan sebagai representasi kemampuan siswa. Secara sederhana gini deh:

Ini struktur tabel dan nama fieldnya masih ngikut rancangan sementara dari Tim 2 ya, bisa berubah jika ERD atau backend uda final ditetapkan

## Intinya gini..

Jadi setelah siswa menyelesaikan pretest, sistem tidak hanya menyimpan hasil akhirnya, tetapi juga menyimpan riwayat pengerjaan soal dan proficiency yang telah diperbarui. Data tersebut kemudian menjadi sumber bagi proses berikutnya, yaitu mengubah hasil perhitungan menjadi data yang dapat digunakan oleh website.

## 5. Mengubah Hasil Menjadi Data untuk Website

Setelah proficiency siswa diperbarui dan disimpan, data tersebut perlu diolah menjadi informasi yang dapat digunakan oleh website. Pada tahap ini, hasil perhitungan tidak langsung ditampilkan dalam bentuk rumus, tetapi diubah menjadi data yang dapat dibaca oleh sistem frontend. Alurnya gini:

Nah data yang diberikan kepada website dapat berupa informasi seperti:

| Data          | Fungsi pada Website                                   |
| ------------- | ----------------------------------------------------- |
| proficiency   | Menunjukkan kemampuan siswa                           |
| submateri     | Menunjukkan bagian materi yang dinilai                |
| status materi | Menentukan kondisi akses materi                       |
|               | starting difficulty Menentukan tingkat kesulitan awal |
| prerequisite  | Menunjukkan kesiapan materi berdasarkan prasyarat     |

Jadi, backend menjadi penghubung antara hasil perhitungan di database dengan website. Website tidak perlu menghitung ulang Elo, tetapi cukup menerima hasil yang sudah diproses dan menggunakannya untuk menentukan informasi yang ditampilkan kepada siswa.

## 6. Representasi Hasil pada Website

Tahap inii adalah main pointtnya, gimana data hasil dari pretest tersebut direpresentasikan ke siswa (melalui website). Data proficiency yang sebelumnya masih berupa angka perlu diterjemahkan jadi informasi yang lebih gampang dipahami pada website. Secara sederhana gini:

Contoh representasi ini macem macem ya, bisa berupa:

- a. Progress kemampuan pada suatu materi atau submateri

- b. Status materi seperti dapat diakses atau masih terkunci

- c. Informasi tingkat kemampuan

- d. Tingkat kesulitan awal yang diberikan kepada siswa

- e. Rekomendasi materi yang perlu dipelajari kembali, dll.

Misalnya:

Dengan demikian, siswa tidak perlu melihat proses perhitungan Elo secara langsung. Sistem mengubah hasil perhitungan tersebut menjadi informasi yang lebih mudah dipahami dan digunakan dalam proses belajar.

## Intinyaa..

Pipeline dimulai dari data jawaban siswa pada pretest, kemudian data tersebut diproses untuk memperbarui proficiency berdasarkan materi atau submateri yang berkaitan. Hasil perhitungan disimpan dalam database, kemudian disediakan melalui backend untuk digunakan oleh website. Selanjutnya, website merepresentasikan hasil tersebut dalam bentuk informasi kemampuan, status materi, dan tingkat kesulitan yang sesuai.

Ini aku cuman hasil 1x Prompt dan masih pake Query sql ( harus diganti ke mongodb, jadi kalian pahamin trus otak atik lagi querynya disesuaiin ke mongo ya)

Pahamin lagi isiannya trus, sesuaiin lagi gapapa ga harus plek ketiplek dari yang kupaste itu

Misal bisa dikembangin kaya nanti algoritma perhitungan cara update soal pretest (yang di standarsasi bagian kalo jawab salah soal jadi mudah, jawab benar jadi susah) itu nanti pengaplikasiannya gimana kan soalnya itu perlu realtime validation di backendnya gitu

_Pipeline Teknis: Representasi Hasil Pretest di Website_

## 1. Frontend → API (Submit Jawaban)

Setiap kali siswa menjawab 1 soal, frontend mengirim request per soal (bukan menunggu 10 soal selesai baru submit sekaligus) — ini penting supaya jika koneksi terputus di tengah sesi, progres tidak hilang total. json

```
POST /api/pretest/{sessionId}/answer
{
"soal_id": "TRIG_S1_MED_001",
"materi_asal_soal_id": "TRIGONOMETRI",
"submateri_asal_id": "S1",
"tipe": "submateri_utama",
"jawaban_siswa": "3/5",
"waktu_menjawab_ms": 8200
}
```

Untuk soal Tahap 0 (prerequisite check), materi_asal_soal_id diisi materi prasyarat (misal ALJABAR_DASAR), bukan TRIGONOMETRI — field inilah yang nanti dipakai backend untuk menentukan rating siapa yang di-update.

## 2. API Layer

Bertugas validasi ringan (soal_id valid, session belum expired, siswa berhak akses sesi ini), lalu meneruskan ke scoring engine. Layer ini tidak melakukan logika bisnis perhitungan rating — dipisah supaya scoring engine bisa diuji/diubah independen dari API.

## 3. Scoring Engine (Inti Pipeline)

Ini bagian paling penting untuk konsep yang sudah kita bahas panjang sebelumnya. Untuk tiap jawaban masuk:

Materi 1. Ambil rating soal saat ini (R_soal) dari tabel Soal

2. Ambil rating siswa saat ini untuk materi_asal_soal_id (R_siswa)

→ query: ProficiencySiswa WHERE user_id=X AND

materi_id=materi_asal_soal_id

3. Hitung E = 1 / (1 + 10^((R_soal - R_siswa)/400))

4. Hitung R_siswa_baru = R_siswa + K × (S - E)

- 5. Simpan R_siswa_baru ke materi_asal_soal_id (BUKAN ke materi yang sedang dites)

- 6. Tambahkan record ke jumlah_percobaan & jumlah_benar soal tsb (dipakai nanti oleh Aggregation Job)

Poin kritis: engine ini selalu merujuk ke materi_asal_soal_id, prinsip yang sudah kita sepakati agar rating tidak tercampur antar materi (Trigonometri tidak boleh terpengaruh rating Kalkulus, dst).

## 4. Database Write

Dua jenis tulis terjadi per jawaban:

```
Materi UPDATE ProficiencySiswa
SET rating = R_siswa_baru, jumlah_soal_dikerjakan += 1
WHERE user_id=X AND materi_id=materi_asal_soal_id AND
submateri_id=submateri_asal_id
INSERT INTO HasilPretest_Detail (
user_id, materi_id_yang_dites, soal_id, materi_asal_soal_id,
submateri_asal_id, tipe, benar, timestamp
)
```

Tabel HasilPretest_Detail inilah sumber data historis yang jadi bahan bakar untuk algoritma pembobotan kesulitan soal (Difficulty_Index) yang sudah kita bahas — makin banyak baris terkumpul, makin akurat estimasi kesulitan tiap soal.

## 5. Aggregation Job (Konteks "Big Data")

Ini bagian yang relevan untuk mata kuliah Big Data-mu — bukan real-time, tapi batch job yang jalan berkala (misal tiap beberapa jam / harian):

```
Untuk tiap soal di bank soal:
jumlah_total = COUNT(HasilPretest_Detail WHERE soal_id = X)
jumlah_benar = COUNT(HasilPretest_Detail WHERE soal_id = X AND benar =
true)
Difficulty_Index = 1 - (jumlah_benar / jumlah_total)
Difficulty_Adjusted = (n × Difficulty_Index + m × Difficulty_Default) / (n + m)
UPDATE Soal SET difficulty_index = Difficulty_Adjusted WHERE id = X
```

Dipisah jadi batch job (bukan dihitung ulang tiap kali ada 1 jawaban masuk) karena: (a) recalculation ini butuh scan banyak baris histori, mahal kalau dilakukan sinkron di request path, (b) perubahan difficulty 1 soal akibat 1 jawaban baru itu dampaknya kecil, tidak perlu real-time. Job ini bisa dibangun pakai scheduled job sederhana (cron) untuk skala project, atau kalau mau nunjukkin unsur "Big Data" yang lebih kental, bisa diarahkan ke pipeline batch processing (misal Spark job) yang scan seluruh tabel histori.

## 6. Response ke Frontend

Setelah semua soal pretest terjawab (atau bisa juga dikirim incremental tiap submateri selesai), backend mengembalikan ringkasan hasil: json

```
GET /api/pretest/{sessionId}/result
{
"materi_id": "TRIGONOMETRI",
"proficiency_keseluruhan": 49,
"submateri": [
{ "id": "S1", "proficiency": 51, "status": "unlocked", "starting_difficulty":
"medium" },
{ "id": "S2", "proficiency": 78, "status": "unlocked", "starting_difficulty":
"hard" },
{ "id": "S3", "proficiency": 35, "status": "unlocked_with_warning",
"starting_difficulty": "easy" },
{ "id": "S4", "proficiency": 28, "status": "soft_locked", "starting_difficulty":
"easy" }
],
"prerequisite_check": [
{ "materi_id": "ALJABAR_DASAR", "benar": true, "rating_update": "+12" },
{ "materi_id": "GEOMETRI_BANGUN_DATAR", "benar": false,
"rating_update": "-9", "rekomendasi": "review_pythagoras" }
],
"gate_materi_lanjutan": {
"TRIGONOMETRI_LANJUTAN": "locked",
"threshold_dibutuhkan": 60
}
} syarat
```

Payload inilah yang jadi satu-satunya sumber kebenaran untuk apapun yang dirender di UI — frontend tidak menghitung apa-apa sendiri, murni menampilkan apa yang dikirim backend.

## 7. Representasi di UI

Dari payload di atas, ada beberapa komponen visual yang biasanya dipakai untuk merepresentasikan hasil ini ke siswa:

| Komponen UI                 | Sumber Data                   | Fungsi                          |
| --------------------------- | ----------------------------- | ------------------------------- |
| Progress bar / radar chart  | submateri[].proficiency       | Menunjukkan kekuatan relatif    |
| per submateri               |                               | tiap submateri secara visual    |
| Badge status (Unlocked /    | submateri[].status            | Menentukan submateri mana       |
| Warning / Locked) pada      |                               | yang bisa langsung diklik untuk |
| peta submateri              |                               | latihan                         |
| Notifikasi rekomendasi      | prerequisite_check[].rekom    | Muncul sebagai banner/modal     |
| review                      | endasi                        | setelah hasil pretest tampil,   |
|                             |                               | mengarahkan ke materi           |
|                             |                               | prasyarat yang lemah            |
| Icon gembok pada materi     | gate_materi_lanjutan          | Materi kelas 11 di peta         |
| lanjutan                    |                               | kurikulum tetap terlihat tapi   |
|                             |                               | non-klikable / muncul tooltip   |
|                             |                               | syarat                          |
| Starting point soal latihan | submateri[].starting_difficul | Dipakai sebagai parameter       |
|                             | ty                            | awal saat siswa mulai sesi      |
|                             |                               | latihan soal (bukan ditampilkan |
|                             |                               | langsung ke siswa)              |

Karena semua state ini (proficiency, status unlock, rekomendasi) sudah dihitung penuh di backend, frontend cukup berperan sebagai lapisan presentasi murni — tidak menyimpan logika bisnis apapun, sehingga kalau algoritma pembobotan diubah di kemudian hari (misal dari Elo pindah ke IRT), tidak ada perubahan yang dibutuhkan di sisi frontend selama bentuk payload-nya konsisten.
