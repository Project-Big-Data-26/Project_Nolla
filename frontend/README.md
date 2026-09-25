# Nalar PDF Question Analyzer

Frontend sementara untuk menguji ekstraksi dan klasifikasi soal dari satu file PDF tanpa MongoDB.

## Alur

```text
PDF
  -> POST /api/v1/ai/extract
  -> kandidat soal dan opsi
  -> POST /api/v1/ai/classify-question per kandidat
  -> ringkasan Bloom, difficulty, dan dimensi pengetahuan
```

Hasil hanya disimpan di state browser. Tombol **Unduh JSON** menghasilkan file yang dapat direview atau diimpor ke sistem penyimpanan kemudian.

## Menjalankan lokal

Jalankan AI service:

```powershell
cd "D:\KULIAH\Big Data\extraction_model"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Jalankan gateway:

```powershell
cd "D:\KULIAH\Big Data\project_assessment\backend"
npm install
npm start
```

Jalankan frontend:

```powershell
cd "D:\KULIAH\Big Data\project_assessment\frontend"
npm install
npm run dev
```

Buka `http://localhost:5173`. Vite meneruskan request `/api` ke gateway pada port `5000`.

## Output UI

- Teks dan opsi setiap kandidat soal.
- Viewer halaman PDF asli agar gambar, tabel, notasi, dan layout tetap identik dengan sumber.
- Crop WebP lossless per soal yang ditampilkan sebagai gambar platform biasa, bukan viewer PDF.
- Halaman sumber dan metode ekstraksi (`text_layer` atau OCR).
- Level Bloom C1-C6 beserta confidence.
- Difficulty Easy/Medium/Hard beserta confidence.
- Dimensi pengetahuan faktual, konseptual, prosedural, atau metakognitif.
- Ringkasan distribusi seluruh kandidat.
- Warning dan penanda kebutuhan review.

Viewer sumber asli menggunakan PDF.js di browser. Teks hasil OCR tidak digunakan untuk membangun ulang tampilan visual; OCR hanya dipakai untuk segmentasi dan klasifikasi. Tombol **Lihat sumber asli** pada setiap kartu membuka halaman PDF tempat kandidat tersebut ditemukan.

Setiap kartu juga menampilkan **Tampilan soal hasil ekstraksi**. Gambar ini dibuat oleh PyMuPDF pada backend berdasarkan batas soal dan dapat langsung dirender dengan elemen `<img>`. KaTeX tetap dipakai pada representasi teks terstruktur ketika sumber mengandung delimiter `$...$`.

Klasifikasi yang memakai `rules_baseline` merupakan hasil advisory. Hasil IndoBERT baru digunakan jika artefak model tersedia di `extraction_model/models/indobert-multitask-v1`.
