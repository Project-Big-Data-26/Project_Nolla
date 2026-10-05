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

`npm run reset:quiz` langsung menjalankan reset untuk ketiga akun di atas.
`npm run reset:pretest` juga langsung menjalankan reset untuk ketiga akun
tersebut.
Pilih satu atau beberapa akun whitelist dengan `--email`, dapat diulang atau
berisi daftar dipisahkan koma:

```sh
npm run reset:quiz -- --email student@example.com
```

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
