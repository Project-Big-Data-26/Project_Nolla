# Seed Curriculum Matematika

Sumber data: `Prasyarat_Math.xlsx` (sheet `FIX YANG INI`).

## Isi
- 3 Jenjang
- 14 kelas/varian kelas
- 80 BAB
- 271 Subbab
- 108 relasi BAB prasyarat

## File
- `curriculumData.js`: data sumber hasil transformasi Excel.
- `seedJenjang.js`: mengisi collection `jenjang`.
- `seedKelas.js`: mengisi collection `kelas`.
- `seedBab.js`: mengisi collection `bab`.
- `seedSubbab.js`: mengisi collection `subbab`.
- `seedBabPrasyarat.js`: mengisi collection `bab_prasyarat`.
- `seedCurriculum.js`: menjalankan semua seed dalam urutan yang benar.
- `seedConnection.js`: koneksi MongoDB.

## Struktur yang digunakan
Seed mengikuti model:
`Jenjang -> Kelas -> Bab -> Subbab`
dan:
`Bab -> BabPrasyarat -> Bab`

`bab_id` seperti `SD1-B6` hanya dipakai sebagai identifier sementara di `curriculumData.js`; nilai tersebut tidak disimpan sebagai `_id` MongoDB.

## Menjalankan
Dari folder project:
```bash
node seed/seedCurriculum.js
```

Default URI:
`mongodb://127.0.0.1:27017/project_assement`

Untuk memakai URI lain:
```bash
MONGODB_URI="mongodb://..." node seed/seedCurriculum.js
```

Seed menggunakan upsert, sehingga aman dijalankan ulang tanpa menggandakan data.
