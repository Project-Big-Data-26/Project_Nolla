# Reset progress akun siswa

`resetStudentProgress.js` hanya menargetkan:

- `student@example.com`
- `student1@example.com`
- `student2@example.com`

Script ini tidak menghapus atau mengubah dokumen user, bab, subbab, soal, atau
konten kurikulum.

Jalankan dari folder `backend`:

```sh
npm run reset:quiz
npm run reset:pretest
```

Tanpa variabel `RESET_EMAIL` atau `--email`, script memakai target default:

- `student@example.com`
- `student1@example.com`
- `student2@example.com`

Jika Anda ingin reset hanya satu atau beberapa email tertentu, gunakan salah satu
cara berikut:

```sh
npm run reset:quiz -- --email student@example.com
RESET_EMAIL="student1@example.com" npm run reset:quiz
RESET_EMAIL="student@example.com,student2@example.com" npm run reset:pretest
```

Jangan menggabungkan `--email` dengan `RESET_EMAIL` di waktu yang sama; script
akan menolak input yang ambigu.

Reset quiz menghapus sesi quiz, catatan jawaban quiz, dan penanda subbab selesai.
Nilai difficulty siswa dibangun ulang dari hasil pretest selesai terbaru per
subbab; subbab tanpa hasil pretest dikembalikan ke medium/1000.

Reset pretest menghapus sesi dan jawaban pretest, serta seluruh data quiz dan
penanda subbab selesai untuk siswa tersebut. Dokumen difficulty yang ada
dikembalikan ke medium/1000 dengan penghitung pretest nol.

Pada MongoDB replica set atau mongos, mutasi dijalankan dalam transaction per
akun. Pada MongoDB standalone transaction tidak tersedia; script memberi
peringatan dan menjalankan operasi berurutan, sehingga backup disarankan
sebelum menerapkan reset.
