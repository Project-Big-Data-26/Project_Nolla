# Catatan Perbaikan Frontend

Catatan ini mengikuti implementasi backend saat ini. Perubahan komponen frontend sengaja belum dilakukan.

## 1. Render Gambar Soal

Backend tetap menyimpan nama file asli pada `Soal.image_url`, misalnya `soal_1.png`. File gambarnya ditempatkan di `backend/public/soal/`. Pada response soal, backend mengubah nama file menjadi URL publik dengan token HMAC stabil, misalnya `http://localhost:5000/image/<token>`. Endpoint `GET /image/:token` menyajikan file tersebut. `IMAGE_BASE_URL` dapat digunakan jika alamat publik backend berbeda dari host request.

Pekerjaan frontend:

- Tetap membaca `image_url` sebagai string atau array string; URL dari API sekarang sudah berupa URL lengkap, bukan nama file.
- Tampilkan semua URL pada soal yang memiliki beberapa gambar, baik di halaman pengerjaan maupun review.
- Karena elemen `<img src>` tidak mengirim header `Authorization`, ambil URL `/image/` memakai instance Axios `API` agar Bearer token ikut dikirim. Tampilkan response blob melalui object URL dan revoke object URL saat URL berubah atau komponen dilepas.
- URL eksternal yang bukan route `/image/` dapat ditampilkan langsung. Tangani status loading dan gambar gagal dimuat tanpa merusak layout soal.
- Jangan menyusun token atau URL gambar sendiri di frontend; gunakan nilai `image_url` dari response API.

File backend terkait: [`questionImage.js`](../backend/utils/questionImage.js), [`imageController.js`](../backend/controllers/imageController.js), dan registrasi route di [`index.js`](../backend/index.js).

## 2. Rating ELO pada Dashboard

[`Dashboard.jsx`](src/pages/Student/Dashboard.jsx) saat ini masih menampilkan statistik dan topik hard-coded. Integrasikan halaman dengan endpoint `GET /api/dashboard/bab?kelas=<nomor-kelas>` menggunakan `API` agar Bearer token terpasang.

Untuk rating yang sedang berlaku, gunakan `data[].subbab[].current_cognitive_score` dan `current_cognitive_level` dari response dashboard. Data ini berasal dari `MendapatkanDifficulty` dan berubah saat quiz memperbarui rating. Gunakan `progress`, `started`, dan status loading/error dari response untuk tampilan progress dan state UI.

Jangan gunakan nilai dari endpoint hasil pretest sebagai rating berjalan. Hasil pretest sekarang membaca snapshot `MengerjakanPretest.subbab_cognitive_scores`; `submateri_result[].current_cognitive_score` adalah hasil/snapshot pretest, bukan ELO terbaru setelah quiz. Bedakan subbab yang belum memiliki aktivitas dari rating yang benar-benar sudah diperbarui; nilai default backend tidak boleh ditampilkan seolah-olah hasil belajar aktual.

File backend terkait: [`dashboardController.js`](../backend/controllers/dashboardController.js) dan [`pretestController.js`](../backend/controllers/pretestController.js).

## Kriteria Selesai

- Gambar dari response quiz, pretest, dan review tampil, termasuk lebih dari satu gambar; request ke `/image/` menyertakan Bearer token.
- Dashboard menampilkan rating berjalan dari response dashboard dan memperbarui tampilan setelah data dimuat.
- Perubahan hasil pretest tidak mengubah sumber rating ELO berjalan yang ditampilkan Dashboard.
- State belum ada aktivitas, loading, error, dan gambar gagal dimuat ditangani dengan jelas.
