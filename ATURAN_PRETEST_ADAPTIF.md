# Aturan Pretest Adaptif Per-Materi

## 1. Tujuan

Pretest digunakan untuk mengukur kesiapan user sebelum mempelajari suatu Bab target.

Alur utama:

1. Cek dan kerjakan soal dari **Bab Prasyarat langsung** jika tersedia.
2. Lanjut ke soal **Subbab pada Bab target**.
3. Soal Subbab bersifat adaptif berdasarkan jawaban soal sebelumnya.
4. Backend menjadi **source of truth** untuk urutan, soal aktif, correctness, dan soal berikutnya.

---

## 2. Struktur Pretest

Rumus jumlah soal:

```text
TOTAL = (jumlah Bab Prasyarat Langsung × 1)
      + (jumlah Subbab Target × 2)
```

Contoh:

- 1 Bab prasyarat
- 2 Subbab target

Maka:

```text
1 + (2 × 2) = 5 soal
```

Urutan:

```text
1. Bab Prasyarat → Hard
2. Subbab 1 → Medium
3. Subbab 1 → Hard / Easy
4. Subbab 2 → Medium
5. Subbab 2 → Hard / Easy
```

### Batasan

- Maksimal **1 soal** untuk setiap Bab Prasyarat langsung.
- Maksimal **2 soal** untuk setiap Subbab target.
- Soal Bab Prasyarat tidak dihitung sebagai soal Subbab target.
- Jika tidak ada Bab Prasyarat, pretest langsung dimulai dari Subbab target.

---

# 3. Cognitive Score dan Kategori Difficulty

Difficulty tidak boleh ditentukan berdasarkan perkiraan `C2/C3/C4` saja.

Backend harus menggunakan `cognitive_score` sebagai sumber kategori difficulty.

| Cognitive Score | Difficulty |
| --------------: | ---------- |
|       `0 - 599` | `easy`     |
|    `600 - 1199` | `medium`   |
|         `1200+` | `hard`     |

Dengan demikian:

```text
0 <= cognitive_score <= 599
    => easy

600 <= cognitive_score <= 1199
    => medium

cognitive_score >= 1200
    => hard
```

### Aturan penting

API pretest harus mampu:

1. membaca `cognitive_score`;
2. menentukan difficulty berdasarkan range di atas;
3. menyimpan difficulty yang digunakan pada pretest;
4. memilih soal berdasarkan difficulty;
5. mengembalikan difficulty pada response jika dibutuhkan frontend;
6. tidak menggunakan `cognitive_level` sebagai pengganti `cognitive_score`.

Contoh:

```js
function getDifficulty(cognitiveScore) {
  if (cognitiveScore < 600) return "easy";
  if (cognitiveScore < 1200) return "medium";
  return "hard";
}
```

Validasi sebaiknya memastikan `cognitive_score` berupa angka dan tidak negatif.

---

# 4. Bank Soal dan Difficulty

Seeder/bank soal harus menyediakan variasi difficulty yang dibutuhkan engine.

Untuk setiap Subbab target, idealnya tersedia:

```text
1 Easy
1 Medium
1 Hard
```

Namun user **tidak mengerjakan ketiganya**.

Engine hanya memberikan:

```text
Medium → Hard
```

atau:

```text
Medium → Easy
```

Jadi:

```text
Medium + Hard = 2 soal
```

atau:

```text
Medium + Easy = 2 soal
```

Bukan:

```text
Easy + Medium + Hard = 3 soal
```

### Catatan Seeder

Jika generator menghasilkan 3 soal:

```text
Easy
Medium
Hard
```

jangan menggunakan:

```js
questions.slice(0, 2);
```

karena hal tersebut dapat membuang soal Hard dan membuat bank tidak memenuhi kebutuhan adaptive engine.

Seeder harus menyimpan soal berdasarkan `cognitive_score`/difficulty sehingga engine dapat mengambil:

```text
Medium
Hard
Easy
```

sesuai kebutuhan.

---

# 5. Tahapan Pretest

## Stage 1 — Bab Prasyarat

Jika Bab target memiliki Bab Prasyarat langsung:

- Prasyarat diproses terlebih dahulu.
- Setiap Bab Prasyarat hanya menghasilkan maksimal 1 soal.
- Soal prasyarat harus memiliki difficulty `hard`.
- Soal prasyarat tidak menggunakan adaptive branching.
- Jawaban benar/salah pada soal prasyarat tidak mengubah aturan soal target.
- Setelah soal prasyarat selesai, pretest berpindah ke Subbab target.

Contoh:

```text
Bab Target
└── Prasyarat: Bab A
    └── 1 soal Hard
```

Jika terdapat dua prasyarat:

```text
Prasyarat A → Hard
Prasyarat B → Hard
```

Maka terdapat maksimal 2 soal prasyarat.

### Jika tidak ada prasyarat

Pretest **tidak boleh membuat placeholder soal prasyarat**.

Langsung:

```text
Subbab 1 → Medium
```

---

# 6. Stage 2 — Subbab Target

Setiap Subbab target memiliki maksimal 2 soal.

### Soal pertama Subbab

Soal pertama selalu:

```text
difficulty = medium
```

Jika user menjawab:

```text
BENAR
```

maka soal berikutnya:

```text
difficulty = hard
```

Jika user menjawab:

```text
SALAH
```

maka soal berikutnya:

```text
difficulty = easy
```

Jadi:

```text
Medium
   │
   ├── Benar → Hard
   │
   └── Salah → Easy
```

### Tidak ada soal ketiga

Setelah soal kedua Subbab selesai:

```text
Subbab selesai
```

Kemudian engine berpindah ke Subbab berikutnya.

---

# 7. Urutan Soal yang Wajib

Backend harus menghasilkan urutan deterministik berdasarkan state pretest.

Jika:

```text
Prasyarat = 1
Subbab = 2
```

maka urutan awal:

```text
Q1  Prasyarat → Hard
Q2  Subbab 1 → Medium
Q3  Subbab 1 → Hard/Easy
Q4  Subbab 2 → Medium
Q5  Subbab 2 → Hard/Easy
```

Jika:

```text
Prasyarat = 0
Subbab = 2
```

maka:

```text
Q1  Subbab 1 → Medium
Q2  Subbab 1 → Hard/Easy
Q3  Subbab 2 → Medium
Q4  Subbab 2 → Hard/Easy
```

Backend tidak boleh mengirim soal prasyarat jika Bab target tidak mempunyai prasyarat.

---

# 8. API Start Pretest Harus Menyimpan Soal

`POST /api/pretest/start` bukan hanya membuat record session.

API ini harus membangun dan menyimpan **rencana/daftar soal pretest** yang akan dikerjakan.

Minimal setiap soal yang tersimpan harus memiliki informasi:

```text
pretest_id
question_id
bab_id
subbab_id
stage
difficulty
sequence
status
```

Contoh:

```json
{
  "pretest_id": "PRETEST_ID",
  "question_id": "QUESTION_ID",
  "bab_id": "BAB_ID",
  "subbab_id": "SUBBAB_ID",
  "stage": "prerequisite",
  "difficulty": "hard",
  "sequence": 1,
  "status": "pending"
}
```

Untuk soal target:

```json
{
  "pretest_id": "PRETEST_ID",
  "question_id": "QUESTION_ID",
  "bab_id": "BAB_ID",
  "subbab_id": "SUBBAB_ID",
  "stage": "target",
  "difficulty": "medium",
  "sequence": 2,
  "status": "pending"
}
```

## Tetapi adaptive question tidak boleh dipilih secara salah sejak awal

Untuk Subbab target, soal kedua bergantung pada jawaban soal pertama.

Karena itu, `POST /start` dapat menyimpan:

1. soal prasyarat;
2. soal pertama setiap Subbab (`medium`);
3. kandidat soal kedua (`hard` dan `easy`) atau informasi yang memungkinkan engine mengambilnya.

Contoh struktur yang aman:

```text
Subbab 1
├── Medium → active/pending
├── Hard   → candidate
└── Easy   → candidate
```

Setelah jawaban Medium diketahui:

```text
Benar → pilih Hard
Salah → pilih Easy
```

Kandidat yang tidak dipilih tidak boleh dianggap sebagai soal yang dikerjakan user.

---

# 9. Soal Aktif / Current Question

Pretest harus memiliki state yang memungkinkan backend mengetahui soal yang sedang dikerjakan.

Contoh:

```text
pretest.status = active
current_sequence = 2
```

atau berdasarkan record soal:

```text
sequence = 2
status = active
```

Tujuan utamanya adalah API tidak selalu membuat/memilih soal baru setiap kali `GET`.

---

# 10. GET Current Question

Endpoint:

```http
GET /api/pretest/:pretestId/question
```

harus mengembalikan **soal yang sedang dikerjakan saat ini**.

Artinya endpoint ini bersifat:

```text
GET current question
```

bukan:

```text
GET random/new question
```

## Contoh flow

User memulai pretest:

```text
POST /start
```

Backend menyimpan:

```text
Q1 = Prasyarat Hard
status = active
```

Kemudian frontend:

```text
GET /:pretestId/question
```

Backend mengembalikan Q1.

Jika frontend melakukan GET lagi sebelum menjawab:

```text
GET /:pretestId/question
```

backend harus tetap mengembalikan:

```text
Q1
```

Bukan memilih Q2.

---

# 11. GET Question Setelah Menjawab

Setelah user menjawab soal aktif melalui:

```http
POST /api/pretest/:pretestId/answer
```

backend menentukan soal berikutnya.

Contoh:

```text
Current:
Subbab 1 Medium

Answer:
correct = true

Next:
Subbab 1 Hard
```

Record kemudian berubah menjadi:

```text
Medium → answered
Hard   → active
```

Maka:

```http
GET /api/pretest/:pretestId/question
```

mengembalikan:

```text
Subbab 1 Hard
```

Jika jawaban Medium salah:

```text
Medium → answered
Easy   → active
```

GET berikutnya mengembalikan Easy.

---

# 12. API Answer Harus Menentukan Next Question

Endpoint:

```http
POST /api/pretest/:pretestId/answer
```

bertanggung jawab untuk:

1. memastikan pretest masih `active`;
2. memastikan question adalah current/active question;
3. menyimpan jawaban user;
4. menghitung benar/salah di backend;
5. menentukan difficulty berikutnya;
6. mengaktifkan soal berikutnya;
7. mengembalikan informasi soal berikutnya atau state yang memungkinkan frontend mengambilnya.

Frontend **tidak boleh menentukan**:

```text
jawaban benar/salah
```

atau:

```text
next difficulty
```

atau:

```text
next question
```

Frontend hanya mengirim jawaban.

---

# 13. Adaptive Logic API Answer

### Kasus 1 — Prasyarat

```text
Current:
Prerequisite Hard

Answer:
Benar / Salah

Next:
Target Subbab 1 Medium
```

Tidak ada branching berdasarkan benar/salah.

### Kasus 2 — Subbab Medium

```text
Current:
Target Subbab Medium

Answer:
Benar
↓
Next:
Target Subbab Hard
```

### Kasus 3 — Subbab Medium

```text
Current:
Target Subbab Medium

Answer:
Salah
↓
Next:
Target Subbab Easy
```

### Kasus 4 — Subbab Hard/Easy

Setelah soal kedua Subbab selesai:

```text
Subbab selesai
↓
Next Subbab
↓
Medium
```

Jika tidak ada Subbab berikutnya:

```text
Pretest selesai
```

---

# 14. Rekomendasi Response `POST /answer`

Response sebaiknya memberikan state yang jelas.

Contoh ketika masih ada soal:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Jawaban berhasil disimpan.",
  "data": {
    "is_correct": true,
    "current_question": {
      "sequence": 2,
      "question_id": "QUESTION_ID"
    },
    "next_question": {
      "sequence": 3,
      "question_id": "QUESTION_ID",
      "difficulty": "hard",
      "stage": "target"
    },
    "is_completed": false
  }
}
```

Jika jawaban salah:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Jawaban berhasil disimpan.",
  "data": {
    "is_correct": false,
    "next_question": {
      "sequence": 3,
      "question_id": "QUESTION_ID",
      "difficulty": "easy",
      "stage": "target"
    },
    "is_completed": false
  }
}
```

Jika tidak ada soal berikutnya:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Pretest selesai.",
  "data": {
    "is_correct": true,
    "next_question": null,
    "is_completed": true
  }
}
```

Catatan: response boleh menggunakan struktur berbeda, tetapi makna state tersebut harus tetap tersedia.

---

# 15. Idempotency / Duplicate Answer

API answer harus mencegah jawaban yang sama diproses berkali-kali.

Contoh:

```text
Q2 masih active
↓
POST answer Q2
↓
Q2 menjadi answered
Q3 menjadi active
```

Jika request yang sama dikirim lagi:

```text
POST answer Q2
```

backend tidak boleh:

```text
Q3 → Q4
```

secara tidak sengaja.

Backend harus memastikan hanya current question yang dapat dijawab dan question yang sudah `answered` tidak diproses ulang.

---

# 16. GET Question Tidak Boleh Mengubah State

`GET /api/pretest/:pretestId/question` harus bersifat read-only.

GET tidak boleh:

- membuat soal baru secara random;
- mengganti current question;
- mengubah sequence;
- menentukan jawaban benar/salah;
- melakukan branching adaptive;
- menandai soal sebagai answered.

Perubahan state terjadi melalui API seperti:

```text
POST /start
POST /answer
POST /submit
DELETE /discard
```

---

# 17. Penyimpanan Soal vs Candidate Soal

Untuk adaptive engine terdapat dua konsep:

### A. Soal yang benar-benar dikerjakan

Contoh:

```text
sequence 1 → Prasyarat Hard → answered
sequence 2 → Medium → answered
sequence 3 → Hard → active
```

### B. Candidate soal

Contoh sebelum jawaban Medium diketahui:

```text
Medium → active
Hard   → candidate
Easy   → candidate
```

Candidate yang tidak dipilih:

```text
Hard/Easy yang tidak dipilih
```

tidak dihitung sebagai soal yang dikerjakan user.

Hal ini penting agar:

```text
TOTAL SOAL USER
```

tetap:

```text
1 prasyarat + (jumlah subbab × 2)
```

dan bukan bertambah karena candidate.

---

# 18. Aturan Pemilihan Soal

Engine harus memilih berdasarkan konteks:

```text
stage
bab_id
subbab_id
difficulty
```

Contoh:

```text
stage = prerequisite
difficulty = hard
```

atau:

```text
stage = target
subbab_id = SUBBAB_1
difficulty = medium
```

Kemudian:

```text
target + SUBBAB_1 + hard
```

atau:

```text
target + SUBBAB_1 + easy
```

Tidak boleh mengambil soal dari:

- Bab lain;
- Subbab lain;
- difficulty yang salah;
- soal yang sudah pernah dijawab pada pretest yang sama.

---

# 19. Validasi Jumlah Soal

Backend harus memvalidasi hasil pembentukan pretest.

Contoh:

```text
Prasyarat = 1
Subbab = 3
Expected = 1 + (3 × 2)
         = 7
```

Jika semua candidate dihitung sebagai soal aktif, hasil bisa menjadi:

```text
1 + (3 × 3) = 10
```

Ini salah.

Yang dihitung sebagai soal yang akan dikerjakan user:

```text
1 prerequisite
+ 2 per subbab
= 7
```

Untuk setiap Subbab:

```text
1 Medium
+ 1 Adaptive (Hard/Easy)
= 2
```

---

# 20. API Start — Expected Behavior

Endpoint:

```http
POST /api/pretest/start
```

harus:

1. menerima Bab target;
2. mencari Bab Prasyarat langsung;
3. mencari Subbab target;
4. menentukan total maksimum soal;
5. mengambil soal Prasyarat Hard jika ada;
6. mengambil soal Medium untuk setiap Subbab;
7. menyiapkan candidate Hard dan Easy untuk branching;
8. menyimpan state/daftar soal ke database;
9. menentukan current question pertama;
10. mengembalikan pretest ID dan current question/state.

### Jika ada prasyarat

Current question pertama:

```text
Prerequisite → Hard
```

### Jika tidak ada prasyarat

Current question pertama:

```text
First Target Subbab → Medium
```

---

# 21. API GET Question — Expected Behavior

Endpoint:

```http
GET /api/pretest/:pretestId/question
```

harus:

1. mencari pretest;
2. memastikan pretest masih valid/active;
3. mencari current question;
4. mengembalikan current question;
5. tidak membuat atau mengganti soal.

Jika user belum menjawab Q1:

```text
GET → Q1
GET → Q1
GET → Q1
```

Semua tetap Q1.

Setelah `POST /answer` memindahkan state ke Q2:

```text
GET → Q2
```

---

# 22. API Answer — Expected Behavior

Endpoint:

```http
POST /api/pretest/:pretestId/answer
```

flow:

```text
1. Ambil current question
2. Validasi question masih active
3. Simpan answer
4. Hitung is_correct
5. Jika prerequisite:
      → next target subbab Medium
6. Jika target + Medium:
      benar → Hard
      salah → Easy
7. Jika target + Hard/Easy:
      → next Subbab Medium
8. Jika tidak ada next:
      → completed candidate
9. Update current question/state
10. Return next question/state
```

---

# 23. Submit Pretest

Endpoint:

```http
POST /api/pretest/:pretestId/submit
```

Submit hanya valid jika seluruh soal yang seharusnya dikerjakan telah selesai.

Backend harus memastikan:

```text
semua sequence aktif sudah answered
```

dan tidak ada soal wajib yang masih pending.

Setelah valid:

```text
pretest.status = completed
```

Baru hasil final dapat dibuat/diakses.

Frontend tidak boleh menentukan sendiri bahwa pretest sudah selesai.

---

# 24. Tidak Ada Resume

Lifecycle:

```text
not_started
    ↓
active
    ↓
completed
```

Jika user keluar sebelum selesai:

```text
active
    ↓
discarded / invalid
```

Tidak ada resume session yang tidak selesai.

Namun selama session masih `active`, `GET /question` harus tetap mengembalikan current question yang tersimpan. Ini berbeda dengan fitur resume setelah session ditinggalkan/di-invalidasi.

---

# 25. Result

Endpoint:

```http
GET /api/pretest/:pretestId/result
```

hanya boleh memberikan hasil final dari pretest yang valid dan selesai.

Result tidak boleh menambahkan soal baru.

Result juga harus membedakan:

```text
Prasyarat
```

dan:

```text
Target Subbab
```

jika informasi tersebut diperlukan untuk analisis.

Soal prasyarat bukan bagian dari jumlah soal Subbab target.

---

# 26. UserProficiency

Setelah pretest valid selesai:

```text
UserProficiency
```

dapat diperbarui berdasarkan hasil.

Source of truth tetap hasil jawaban yang tersimpan di backend.

Jangan menghitung proficiency berdasarkan data yang hanya dikirim frontend.

---

# 27. Contoh Kelas 12 — Peluang

Misalnya:

```text
Target:
Kelas 12 — Peluang

Prasyarat langsung:
Kelas 10 — Peluang

Subbab:
S1
S2
S3
```

Maka:

```text
1 Prasyarat × 1 = 1
3 Subbab × 2 = 6

TOTAL = 7
```

Urutan:

```text
Q1 → Kelas 10 Peluang → Hard

Q2 → S1 → Medium
Q3 → S1 → Hard jika Q2 benar
           Easy jika Q2 salah

Q4 → S2 → Medium
Q5 → S2 → Hard jika Q4 benar
           Easy jika Q4 salah

Q6 → S3 → Medium
Q7 → S3 → Hard jika Q6 benar
           Easy jika Q6 salah
```

---

# 28. Contoh Cognitive Score

Misalnya bank soal memiliki:

```text
Question A → cognitive_score = 450
Question B → cognitive_score = 800
Question C → cognitive_score = 1300
```

Maka:

```text
450  → Easy
800  → Medium
1300 → Hard
```

Jika engine membutuhkan soal Medium:

```text
ambil soal dengan 600–1199
```

Jika membutuhkan Hard:

```text
ambil soal dengan >= 1200
```

Jika membutuhkan Easy:

```text
ambil soal dengan 0–599
```

---

# 29. Kesalahan Implementasi yang Harus Dihindari

### Salah 1 — Prasyarat Medium

```text
Prerequisite → Medium
```

**Salah.**

Aturan final:

```text
Prerequisite → Hard
```

---

### Salah 2 — Tidak ada prasyarat tetapi tetap membuat soal prasyarat

**Salah.**

Jika tidak ada prasyarat:

```text
langsung Target Subbab 1 → Medium
```

---

### Salah 3 — GET membuat soal baru

```text
GET /question
→ random question
```

**Salah.**

GET harus mengambil current question yang tersimpan.

---

### Salah 4 — Answer hanya menyimpan jawaban

Jika API answer hanya:

```text
save answer
```

tetapi tidak menentukan next question, adaptive flow tidak lengkap.

API answer harus menentukan:

```text
is_correct
→ next difficulty
→ next question
→ update current state
```

---

### Salah 5 — Frontend menentukan adaptive

Frontend tidak boleh melakukan:

```js
if (isCorrect) {
  nextDifficulty = "hard";
} else {
  nextDifficulty = "easy";
}
```

Keputusan tersebut harus berasal dari backend.

---

### Salah 6 — Menganggap C2 = Easy, C3 = Medium, C4 = Hard secara mutlak

Difficulty final ditentukan oleh:

```text
cognitive_score
```

dengan range:

```text
0–599      = Easy
600–1199   = Medium
1200+      = Hard
```

---

### Salah 7 — Seeder hanya menyimpan 2 soal pertama

Contoh:

```js
questions.slice(0, 2);
```

dapat membuang salah satu difficulty yang dibutuhkan.

Bank harus memungkinkan engine menemukan:

```text
Easy
Medium
Hard
```

---

### Salah 8 — Candidate dihitung sebagai soal user

Jika tersedia:

```text
Medium
Hard candidate
Easy candidate
```

itu bukan 3 soal.

Yang dikerjakan user hanya:

```text
Medium
+
Hard atau Easy
```

---

# 30. Kontrak Data Minimal

Recommended structure untuk record soal pretest:

```json
{
  "pretest_id": "PRETEST_ID",
  "question_id": "QUESTION_ID",
  "bab_id": "BAB_ID",
  "subbab_id": "SUBBAB_ID",
  "stage": "prerequisite",
  "difficulty": "hard",
  "sequence": 1,
  "status": "active",
  "user_answer": null,
  "is_correct": null,
  "answered_at": null
}
```

Untuk candidate adaptive:

```json
{
  "pretest_id": "PRETEST_ID",
  "question_id": "QUESTION_ID",
  "bab_id": "BAB_ID",
  "subbab_id": "SUBBAB_ID",
  "stage": "target",
  "difficulty": "hard",
  "sequence": null,
  "status": "candidate"
}
```

Candidate `easy` memiliki struktur yang sama dengan:

```text
difficulty = easy
status = candidate
```

Candidate tidak boleh memiliki `sequence` sebagai soal yang dikerjakan sebelum dipilih.

---

# 31. Prinsip Final Implementasi

Aturan yang menjadi acuan implementasi:

1. **Bab Prasyarat diproses lebih dahulu.**
2. **Setiap Bab Prasyarat maksimal 1 soal.**
3. **Soal Prasyarat selalu Hard (`cognitive_score >= 1200`).**
4. **Jika tidak ada prasyarat, langsung ke Subbab target.**
5. **Setiap Subbab maksimal 2 soal.**
6. **Soal pertama Subbab selalu Medium (`600–1199`).**
7. **Jika Medium benar → Hard (`>= 1200`).**
8. **Jika Medium salah → Easy (`0–599`).**
9. **Hard dan Easy adalah alternatif, bukan dua soal sekaligus.**
10. **Difficulty ditentukan berdasarkan `cognitive_score`, bukan hanya `cognitive_level`.**
11. **`POST /start` harus menyimpan state/daftar soal yang dibutuhkan untuk pretest.**
12. **`GET /question` selalu mengambil current question yang tersimpan.**
13. **`GET /question` tidak boleh membuat random/new question.**
14. **`POST /answer` harus menghitung correctness dan menentukan next question secara adaptive.**
15. **Frontend tidak menentukan correctness atau next question.**
16. **Candidate Hard/Easy yang tidak dipilih bukan soal yang dikerjakan.**
17. **Total soal user mengikuti `prasyarat × 1 + subbab × 2`.**
18. **Submit hanya valid jika seluruh soal wajib selesai.**
19. **Pretest yang valid selesai menjadi `completed`.**
20. **Session yang ditinggalkan/di-invalidasi tidak dapat di-resume.**
21. **Backend menjadi source of truth untuk seluruh state pretest.**

---

# 32. Checklist Implementasi API

### `POST /api/pretest/start`

- [ ] Cari Bab target.
- [ ] Cari Bab Prasyarat langsung.
- [ ] Cari seluruh Subbab target.
- [ ] Hitung expected total.
- [ ] Pilih 1 soal Hard per prasyarat.
- [ ] Pilih 1 soal Medium per Subbab.
- [ ] Siapkan candidate Hard dan Easy untuk setiap Subbab.
- [ ] Simpan state ke database.
- [ ] Tentukan current question pertama.
- [ ] Return `pretest_id`.
- [ ] Return current question/state.

### `GET /api/pretest/:pretestId/question`

- [ ] Validasi pretest.
- [ ] Pastikan status active.
- [ ] Ambil current question.
- [ ] Return question yang sedang dikerjakan.
- [ ] Jangan membuat soal baru.
- [ ] Jangan mengubah state.

### `POST /api/pretest/:pretestId/answer`

- [ ] Validasi current question.
- [ ] Validasi belum pernah dijawab.
- [ ] Simpan answer.
- [ ] Hitung `is_correct`.
- [ ] Jika prerequisite → lanjut ke Subbab Medium.
- [ ] Jika Medium benar → pilih Hard.
- [ ] Jika Medium salah → pilih Easy.
- [ ] Jika Hard/Easy selesai → lanjut Subbab berikutnya.
- [ ] Jika semua selesai → tandai siap submit/completed sesuai lifecycle.
- [ ] Return next question/state.
- [ ] Lindungi dari duplicate request.

### `POST /api/pretest/:pretestId/submit`

- [ ] Validasi seluruh soal wajib sudah dijawab.
- [ ] Validasi session.
- [ ] Finalisasi pretest.
- [ ] Hitung hasil.
- [ ] Update proficiency sesuai aturan.
- [ ] Tidak membuat soal baru.

### `GET /api/pretest/:pretestId/result`

- [ ] Hanya untuk pretest valid/selesai.
- [ ] Return hasil yang tersimpan.
- [ ] Tidak mengubah state.
- [ ] Tidak membuat soal baru.

### `DELETE /api/pretest/:pretestId/discard`

- [ ] Hanya session yang sesuai yang dapat di-discard.
- [ ] Tandai session invalid/discarded.
- [ ] Tidak dapat dilanjutkan sebagai pretest valid.

---

# 33. Status Dokumen

Dokumen ini menjadi acuan implementasi **Pretest Adaptif Per-Materi**.

Perubahan utama dari aturan sebelumnya:

| Aturan                          | Final                                 |
| ------------------------------- | ------------------------------------- |
| Difficulty Prasyarat            | **Hard**                              |
| Soal Prasyarat                  | **1 per Bab Prasyarat langsung**      |
| Soal pertama Subbab             | **Medium**                            |
| Medium benar                    | **Hard**                              |
| Medium salah                    | **Easy**                              |
| Soal per Subbab                 | **Maksimal 2**                        |
| Easy + Medium + Hard dikerjakan | **Tidak**                             |
| Difficulty source               | **Cognitive Score**                   |
| `0–599`                         | **Easy**                              |
| `600–1199`                      | **Medium**                            |
| `1200+`                         | **Hard**                              |
| GET Question                    | **Ambil current question tersimpan**  |
| POST Answer                     | **Menentukan next question adaptive** |
| Frontend menentukan adaptive    | **Tidak**                             |
| Backend source of truth         | **Ya**                                |
| Resume setelah discard/invalid  | **Tidak**                             |

**Prioritas aturan:** bagian `Prinsip Final Implementasi` dan `Checklist Implementasi API` adalah acuan utama apabila terdapat perbedaan dengan aturan lama.
