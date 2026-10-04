# Desain API Quiz Elo Berdasarkan Model Saat Ini

## 1. Status model

Setelah analisis model yang sudah ada, keputusan final adalah:

- tidak menambah field baru
- tidak mengubah struktur model utama
- tidak menambah atribut before/after
- tetap memakai model yang sudah ada saat ini

Model yang dipakai:

- `MendapatkanDifficulty` = rating aktif user per subbab
- `MengerjakanKuis` = catatan satu attempt quiz

Dengan begitu, quiz dapat diulang terus seperti permainan catur, tanpa perlu perubahan besar pada skema data.

---

## 2. Peran masing-masing model

### 2.1 `MendapatkanDifficulty`

Model ini tetap menjadi sumber utama rating user.

Field utama:

- `user_id`
- `subbab_id`
- `current_cognitive_score`
- `current_cognitive_level`
- `pretest_subbab_correct`
- `pretest_subbab_total`
- `updated_at`

Aturan:

- `current_cognitive_score` adalah atribut kuat dan menjadi sumber Elo
- `current_cognitive_level` adalah atribut lemah / derived, bukan input utama
- rating bersifat per subbab, bukan global
- range soal untuk menentukan track quiz adalah:
  - easy: 0-599
  - medium: 600-1199
  - hard: 1200+
- nilai default representatif soal yang dipakai untuk baseline Elo adalah:
  - easy: 500
  - medium: 1000
  - hard: 1400

### 2.2 `MengerjakanKuis`

Model ini tetap menjadi historis one attempt quiz.

Field yang sudah ada:

- `user_id`
- `subbab_id`
- `sesi_ke`
- `cognitive_score`
- `soal`
- `score`
- `duration`
- `started_at`
- `completed_at`

Aturan:

- `sesi_ke` digunakan untuk membedakan attempt ke-1, ke-2, ke-3, dst.
- quiz bisa diulang terus tanpa perlu model baru
- `cognitive_score` pada attempt dipahami sebagai rating user pada saat attempt dimulai, yang diambil dari `MendapatkanDifficulty.current_cognitive_score`
- `completed_at` dipakai sebagai waktu submit final
- semua soal dalam satu quiz harus berada pada satu difficulty track yang ditentukan dari rating saat quiz dimulai
- soal tidak boleh muncul lebih dari satu kali dalam sesi quiz yang sama
- baseline representatif soal tetap menggunakan: easy 500, medium 1000, hard 1400

Catatan penting:

- tidak ada `before` dan `after` karena semua update rating aktif dipindahkan ke `MendapatkanDifficulty`
- `MengerjakanKuis` bukan tempat primary rating, melainkan history attempt

---

## 3. Prinsip Elo yang dipakai

Sesuai konsep yang sudah ada di dokumen Elo:

- user rating per subbab
- band level soal untuk menentukan track quiz adalah:
  - easy = 0-599
  - medium = 600-1199
  - hard = 1200+
- nilai default representatif soal yang dipakai dalam baseline Elo adalah:
  - easy = 500
  - medium = 1000
  - hard = 1400
- `K_siswa = 24`
- `K_soal_efektif = 8 / sqrt(jumlah_percobaan_soal + 1)`

Formula utama:

- `E = 1 / (1 + 10^((R_soal - R_siswa) / 400))`
- `R_siswa_baru = R_siswa + K_siswa * (S - E)`
- `R_soal_baru = R_soal + K_soal_efektif * ((1 - S) - (1 - E))`

Semua proses ini dilakukan oleh backend.

### 3.1 Aturan pemilihan difficulty quiz

Quiz menggunakan satu difficulty track tetap untuk seluruh sesi. Track ditentukan satu kali ketika quiz dimulai berdasarkan `MendapatkanDifficulty.current_cognitive_score`:

| Rating user saat mulai | Track quiz | Soal yang boleh diberikan |
| ---------------------- | ---------- | ------------------------- |
| 0-599                  | Easy       | Easy saja                 |
| 600-1199               | Medium     | Medium saja               |
| 1200+                  | Hard       | Hard saja                 |

Contoh: jika rating user adalah 1200 atau lebih saat memulai quiz, maka seluruh soal yang dikirim dalam sesi tersebut harus hard. Backend tidak boleh mencampur soal easy, medium, dan hard dalam satu sesi berdasarkan jawaban user.

Aturan tambahan:

- rating tidak berpindah track di tengah sesi walaupun rating aktif berubah setelah jawaban diproses
- setiap soal hanya boleh muncul satu kali dalam sesi yang sama
- backend harus mengecualikan soal yang sudah dipilih sebelumnya pada sesi tersebut
- jika bank soal pada track tersebut tidak cukup untuk memenuhi jumlah soal, backend harus mengurangi jumlah soal atau mengembalikan error yang jelas; backend tidak boleh mengisi kekurangan dengan track lain

Branching `jawab benar -> hard` dan `jawab salah -> easy` hanya berlaku untuk struktur pretest yang sudah ditetapkan, bukan untuk quiz berulang.

---

## 4. Alur flow quiz

### 4.1 Setelah pretest: daftar subbab dari endpoint yang sudah ada

Tidak perlu membuat API dashboard baru. Flow yang benar sudah ada melalui endpoint yang sudah dipakai saat ini:

- `GET /api/dashboard/bab`

Tujuan endpoint ini adalah:

1. menampilkan subbab yang sudah tersedia setelah user menyelesaikan pretest
2. menyertakan `subbab_id` untuk setiap subbab yang bisa dipilih
3. menyediakan data awal untuk masuk ke quiz

Response contoh:

```json
{
  "data": [
    {
      "subbab_id": "abc",
      "name": "Trigonometri",
      "status": "unlocked",
      "pretest_done": true
    }
  ]
}
```

Setelah user memilih subbab dari hasil `/api/dashboard/bab`, frontend langsung memanggil start quiz dengan `subbab_id` yang dipilih.

---

### 4.2 Start quiz

Saat user klik subbab:

1. backend validasi subbab valid dan unlock
2. backend hitung `sesi_ke` terbaru untuk user + subbab
3. backend ambil rating user saat ini dari `MendapatkanDifficulty.current_cognitive_score`
4. backend menentukan satu difficulty track dari rating tersebut
5. backend mengambil soal dari subbab dan track tersebut saja
6. backend memastikan tidak ada soal duplikat dalam sesi
7. backend buat record baru di `MengerjakanKuis`
8. backend kirim semua soal ke frontend

Endpoint yang disarankan:

- `POST /api/quiz/start`

Body contoh:

```json
{
  "user_id": "user_123",
  "subbab_id": "subbab_456"
}
```

Response contoh:

```json
{
  "session_id": "quiz_001",
  "subbab_id": "subbab_456",
  "sesi_ke": 3,
  "started_at": "2026-09-27T10:00:00Z",
  "questions": [
    {
      "id": "soal_1",
      "soal_text": "Jika sin x = 1/2 ...",
      "options": [
        { "option_id": "A", "text": "30°" },
        { "option_id": "B", "text": "45°" }
      ]
    }
  ]
}
```

Catatan:

- frontend menyimpan jawaban di client
- backend hanya mengirim soal, bukan jawaban
- seluruh soal pada response harus berasal dari track difficulty yang sama

---

### 4.3 Submit quiz

Saat user menekan submit:

1. backend cari session aktif di `MengerjakanKuis`
2. backend baca `cognitive_score` dari session untuk snapshot rating sebelum attempt
3. backend ambil `current_cognitive_score` dari `MendapatkanDifficulty` untuk user + subbab
4. backend hitung jawaban benar/salah
5. backend hitung Elo update
6. backend update rating aktif di `MendapatkanDifficulty`
7. backend update `completed_at` dan `score`
8. backend simpan hasil final attempt

Endpoint yang disarankan:

- `POST /api/quiz/:sessionId/submit`

Body contoh:

```json
{
  "user_id": "user_123",
  "subbab_id": "subbab_456",
  "answers": [
    { "question_id": "soal_1", "selected_option": "A" },
    { "question_id": "soal_2", "selected_option": "B" }
  ],
  "duration": 420000
}
```

Response contoh:

```json
{
  "session_id": "quiz_001",
  "subbab_id": "subbab_456",
  "correct_count": 12,
  "total_questions": 15,
  "cognitive_score_before": 1000,
  "cognitive_score_after": 1018,
  "completed_at": "2026-09-27T10:15:00Z"
}
```

Catatan:

- `cognitive_score_before` pada response boleh berasal dari `MengerjakanKuis.cognitive_score`
- `cognitive_score_after` pada response adalah nilai yang sudah berhasil diupdate di `MendapatkanDifficulty.current_cognitive_score`, bukan field baru yang disimpan di DB

---

### 4.4 Result attempt

Untuk menampilkan hasil sesi terakhir:

- `GET /api/quiz/:sessionId/result`

Response contoh:

```json
{
  "session_id": "quiz_001",
  "subbab_id": "subbab_456",
  "sesi_ke": 3,
  "correct_count": 12,
  "total_questions": 15,
  "score": 12,
  "duration": 420000,
  "started_at": "2026-09-27T10:00:00Z",
  "completed_at": "2026-09-27T10:15:00Z",
  "cognitive_score": 1000
}
```

---

## 5. Kesimpulan desain final

Desain final yang paling aman untuk team adalah:

- tetap memakai model yang sekarang ada
- tidak menambah field baru
- mempertahankan `sesi_ke` untuk retry / repeated attempt
- memakai `MendapatkanDifficulty.current_cognitive_score` sebagai rating aktif user
- memakai `MengerjakanKuis.cognitive_score` sebagai snapshot rating saat attempt dimulai
- memakai `completed_at` sebagai waktu submit final
- semua update Elo dilakukan di backend, bukan FE

Dengan demikian:

- quiz bisa diulang terus seperti bermain catur
- rating change terjadi per subbab
- history quiz tetap tersimpan
- struktur model tidak berubah besar dan tetap sesuai kebijakan tim

---

## 6. Rekomendasi implementasi

Jangan ubah model sekarang. Fokus implementasi backend berikut:

1. gunakan endpoint yang sudah ada: `GET /api/dashboard/bab` untuk mendapatkan daftar subbab setelah pretest
2. create quiz session berdasarkan `subbab_id` yang dipilih
3. submit final jawaban
4. hitung Elo
5. update rating aktif di `MendapatkanDifficulty`
6. simpan result attempt di `MengerjakanKuis`

Semua poin di atas sudah cocok dengan model yang ada saat ini.
