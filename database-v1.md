| users                                                                           | Strong Entity                                                                                                                                                                    | Menyimpan data akun pengguna. User dapat berdiri sendiri dan menjadi pusat berbagai aktivitas dalam sistem. |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Attribute Tipe Data \_id ObjectId                                               | Fungsi ID unik user.                                                                                                                                                             |                                                                                                             |
| name String email String                                                        | Nama user. Email untuk login dan komunikasi.                                                                                                                                     |                                                                                                             |
| password String / Null googleId String / Null                                   | Password yang sudah di-hash. Null jika menggunakan login Google. ID akun Google jika login menggunakan Google.                                                                   |                                                                                                             |
| jenjang_id ObjectId → jenjang.\_id isVerified Boolean isProfileComplete Boolean | Jenjang yang dipilih user untuk personalisasi. Null jika user melewati personalisasi. Menunjukkan apakah email sudah diverifikasi. Menunjukkan apakah profil user sudah lengkap. |                                                                                                             |
| created_at Date updated_at Date                                                 | Waktu akun dibuat. Waktu data akun terakhir diperbarui.                                                                                                                          |                                                                                                             |
| role enum                                                                       | Role user: Siswa, Guru, Admin Role Siswa                                                                                                                                         |                                                                                                             |
| jenjang Attribute Tipe Data                                                     | Strong Entity Fungsi                                                                                                                                                             | Menyimpan tingkatan pendidikan yang tersedia.                                                               |
| \_id ObjectId name String                                                       | ID unik jenjang. Nama jenjang, misalnya SD, SMP, SMA.                                                                                                                            |                                                                                                             |
| kelas                                                                           | Weak Entity                                                                                                                                                                      | Kelas bergantung pada jenjang. Sebuah kelas tidak berdiri sendiri karena harus berada pada suatu jenjang.   |
| Attribute Tipe Data \_id ObjectId                                               | Fungsi Identitas/ID konseptual: jenjang_id + nomor_kelas                                                                                                                         |                                                                                                             |
| jenjang_id ObjectId → jenjang.\_id name String                                  | Menunjukkan kelas berada pada jenjang apa. Nama kelas, misalnya Kelas 4 SD atau Kelas 10 SMA.                                                                                    |                                                                                                             |
| nomor_kelas Int32                                                               | Nomor kelas, misalnya 4, 10, 11, atau 12.                                                                                                                                        |                                                                                                             |
| bab Attribute Tipe Data                                                         | Weak Entity Fungsi                                                                                                                                                               | BAB bergantung pada kelas. BAB merupakan materi yang berada di dalam suatu kelas.                           |
| \_id ObjectId kelas_id ObjectId → kelas.\_id                                    | Identitas/ID konseptual: kelas_id + display_order Menunjukkan BAB berada pada kelas mana.                                                                                        |                                                                                                             |
| name String description String / Null                                           | Nama BAB. Deskripsi singkat BAB.                                                                                                                                                 |                                                                                                             |
| display_order Int32                                                             | Urutan BAB dalam kelas.                                                                                                                                                          |                                                                                                             |
| subbab Attribute Tipe Data \_id ObjectId                                        | Weak Entity Fungsi Identitas/ID konseptual: bab_id + display_order                                                                                                               | Subbab bergantung pada BAB karena subbab merupakan bagian dari suatu BAB.                                   |
| bab_id ObjectId → bab.\_id name String description String / Null                | Menunjukkan subbab berada pada BAB mana. Nama subbab. Deskripsi singkat subbab.                                                                                                  |                                                                                                             |
| display_order Int32                                                             | Urutan subbab di dalam BAB.                                                                                                                                                      |                                                                                                             |
| memiliki_prasyarat Attribute Tipe Data                                          | Relationship / Associative Entity Fungsi                                                                                                                                         | Menghubungkan BAB dengan BAB lain yang menjadi prasyarat.                                                   |
| \_id ObjectId bab_id ObjectId → bab.\_id                                        | Identitas/ID: bab_id + relasi_bab_id BAB yang membutuhkan prasyarat.                                                                                                             |                                                                                                             |
| relasi_bab_id ObjectId → bab.\_id                                               | BAB yang menjadi prasyarat.                                                                                                                                                      |                                                                                                             |

|                                  |                                                                           | Menghubungkan user dengan BAB melalui aktivitas pretest.    |
| -------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| mengerjakan_pretest              | Relationship / Associative Entity                                         | Karena pretest hanya dilakukan satu kali untuk satu BAB,    |
|                                  |                                                                           | kombinasi user_id + bab_id sudah cukup sebagai Identitas/ID |
|                                  |                                                                           | hubungan.                                                   |
| Attribute Tipe Data              | Fungsi                                                                    |                                                             |
| \_id ObjectId                    | Identitas/ID: user_id + bab_id                                            |                                                             |
| user_id ObjectId → users.\_id    | User yang mengerjakan pretest.                                            |                                                             |
| bab_id ObjectId → bab.\_id       | BAB yang diuji.                                                           |                                                             |
| score Decimal128                 | Nilai akhir pretest.                                                      |                                                             |
| duration Int32                   | Lama pengerjaan dalam detik.                                              |                                                             |
| started_at Date                  | Waktu pretest dimulai.                                                    |                                                             |
| completed_at Date                | Waktu pretest selesai.                                                    |                                                             |
| menjawab_soal_pretest            | Relationship / Associative Entity                                         | Menghubungkan sesi pretest dengan soal yang diberikan dan   |
|                                  |                                                                           | menyimpan jawaban user.                                     |
| Attribute Tipe Data              | Fungsi                                                                    |                                                             |
| \_id ObjectId                    | Identitas/ID: pretest + soal atau secara implementasi dapat menggunakan   |                                                             |
|                                  | pretest_id + sequence.                                                    |                                                             |
| pretest_id ObjectId              | Menunjukkan soal berada pada pretest mana.                                |                                                             |
| soal_id ObjectId → soal.\_id     | Soal yang diberikan.                                                      |                                                             |
| selected_answer String           | Jawaban yang dipilih user.                                                |                                                             |
| is_correct Boolean               | Menunjukkan jawaban benar atau salah.                                     |                                                             |
| response_time Int32              | Waktu user menjawab soal dalam detik.                                     |                                                             |
| sequence Int32                   | Urutan soal dalam pretest. sequence tetap penting karena soal pretest     |                                                             |
|                                  | bersifat adaptif.                                                         |                                                             |
|                                  |                                                                           | Menghubungkan user dengan subbab untuk menyimpan            |
| mendapatkan_difficulty           | Relationship / Associative Entity                                         | perkembangan tingkat kesulitan latihan. Relationship ini    |
|                                  |                                                                           | menggantikan konsep subbab_adaptive (sebelumnya)            |
| Attribute Tipe Data              | Fungsi                                                                    |                                                             |
| \_id ObjectId                    | Identitas/ID: user_id + subbab_id                                         |                                                             |
| user_id ObjectId → users.\_id    | User yang memiliki hasil adaptive.                                        |                                                             |
| subbab_id ObjectId → subbab.\_id | Subbab yang sedang dipelajari.                                            |                                                             |
|                                  | Difficulty yang sedang digunakan untuk latihan berikutnya. Pertama-tama   |                                                             |
| current_cognitive_level String   | didapatkan dari hasil pretest -> c1-c2: Easy, c3-c4: Medium, Hard: c5-c6: |                                                             |
|                                  | Hard                                                                      |                                                             |
| current_cognitive_score Int32    | Nilai difficulty yang sedang digunakan.                                   |                                                             |
| pretest_subbab_correct Int32     | Jumlah soal subbab yang benar pada pretest.                               |                                                             |
| pretest_subbab_total Int32       | Jumlah soal subbab pada pretest.                                          |                                                             |
| updated_at Date                  | Waktu terakhir difficulty diperbarui.                                     |                                                             |
| mengerjakan_kuis                 | Relationship / Associative Entity                                         | Menghubungkan user dengan subbab melalui satu sesi latihan. |
|                                  |                                                                           | Satu user dapat memiliki banyak sesi pada subbab yang sama. |
| Attribute Tipe Data              | Fungsi                                                                    |                                                             |
| \_id ObjectId                    | Identitas/ID konseptual: user_id + subbab_id + sesi_ke                    |                                                             |
| user_id ObjectId → users.\_id    | User yang mengerjakan latihan.                                            |                                                             |
| subbab_id ObjectId → subbab.\_id | Subbab yang dilatih.                                                      |                                                             |
| sesi_ke Int32                    | Menunjukkan latihan keberapa pada subbab tersebut.                        |                                                             |
| cognitive_level String           | Difficulty yang digunakan pada sesi tersebut.                             |                                                             |
| cognitive_score Int32            | Nilai difficulty pada sesi tersebut.                                      |                                                             |
| soal Array Object                | Menyimpan soal-soal yang muncul beserta jawaban user.                     |                                                             |
| soal_id ObjectId → soal.\_id     | Soal yang diberikan pada sesi.                                            |                                                             |
| pilihan_jawaban String           | Jawaban yang dipilih user.                                                |                                                             |
| is_correct Boolean               | Status benar atau salah.                                                  |                                                             |
| response_time Int32              | Waktu menjawab soal dalam detik.                                          |                                                             |
| score Decimal128                 | Nilai akhir sesi latihan.                                                 |                                                             |

| duration      | Int32                  | Lama pengerjaan dalam detik.                                                                         |
| ------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| started_at    | Date                   | Waktu sesi dimulai.                                                                                  |
| completed_at  | Date                   | Waktu sesi selesai.                                                                                  |
|               |                        | Mencatat bahwa seorang user sudah pernah mengerjakan suatu                                           |
|               | menjawab_soal          | Relationship / Associative Entity soal. Relationship ini digunakan agar sistem tidak memberikan soal |
|               |                        | yang sama lagi kepada user.                                                                          |
| Attribute     | Tipe Data              | Fungsi                                                                                               |
| \_id          | ObjectId               | Identitas/ID: user_id + soal_id                                                                      |
| user_id       | ObjectId → users.\_id  | User yang sudah mengerjakan soal.                                                                    |
| soal_id       | ObjectId → soal.\_id   | Soal yang sudah dikerjakan.                                                                          |
| dikerjakan_at | Date                   | Waktu pertama kali soal dikerjakan.                                                                  |
|               | menyelesaikan_subbab   | Mencatat bahwa user sudah berhasil menyelesaikan sebuah Relationship / Associative Entity            |
|               |                        | subbab.                                                                                              |
| Attribute     | Tipe Data              | Fungsi                                                                                               |
| \_id          | ObjectId               | Identitas/ID: user_id + subbab_id                                                                    |
| user_id       | ObjectId → users.\_id  | User yang menyelesaikan subbab.                                                                      |
| subbab_id     | ObjectId → subbab.\_id | Subbab yang telah diselesaikan.                                                                      |
| completed_at  | Date                   | Waktu subbab dinyatakan selesai.                                                                     |
|               | refreshTokens          | Weak Entity / Entity Teknis Menyimpan refresh token milik user untuk proses autentikasi.             |
| Attribute     | Tipe Data              | Fungsi                                                                                               |
| \_id          | ObjectId               | ID teknis MongoDB.                                                                                   |
| user_id       | ObjectId → users.\_id  | Pemilik refresh token.                                                                               |
| tokenHash     | String                 | Hash refresh token.                                                                                  |
| expiresAt     | Date                   | Waktu token kedaluwarsa.                                                                             |
| revokedAt     | Date / Null            | Waktu token dicabut. Null jika belum dicabut.                                                        |
| createdAt     | Date                   | Waktu token dibuat.                                                                                  |
| updatedAt     | Date                   | Waktu token diperbarui.                                                                              |
|               | otps                   | Menyimpan kode OTP untuk proses verifikasi email dan reset Entity Teknis                             |
|               |                        | password.                                                                                            |
| Attribute     | Tipe Data              | Fungsi                                                                                               |
| \_id          | ObjectId               | ID teknis OTP.                                                                                       |
| email         | String                 | Email tujuan OTP.                                                                                    |
| otp           | String                 | Kode OTP.                                                                                            |
| type          | String / Enum          | Jenis OTP: EMAIL_VERIFICATION atau PASSWORD_RESET.                                                   |
| expiresAt     | Date                   | Waktu OTP tidak berlaku lagi.                                                                        |
| createdAt     | Date                   | Waktu OTP dibuat.                                                                                    |
| updatedAt     | Date                   | Waktu OTP diperbarui.                                                                                |
|               | revokedTokens          | Menyimpan token yang sudah dicabut sehingga tidak dapat Entity Teknis                                |
|               |                        | digunakan lagi.                                                                                      |
| Attribute     | Tipe Data              | Fungsi                                                                                               |
| \_id          | ObjectId               | ID teknis data token.                                                                                |
| token         | String                 | Token yang sudah dicabut.                                                                            |
| expiresAt     | Date                   | Waktu token kedaluwarsa.                                                                             |
| createdAt     | Date                   | Waktu token dicatat.                                                                                 |
| updatedAt     | Date                   | Waktu data diperbarui.                                                                               |
|               |                        | Role Admin dan Guru                                                                                  |
|               | berkas                 | Strong Entity                                                                                        |
| Atribut       | Tipe                   | Fungsi                                                                                               |

| \_id             | ObjectId               | ID unik berkas                                                            |
| ---------------- | ---------------------- | ------------------------------------------------------------------------- |
| file_name        | String                 | Nama file                                                                 |
| file_url         | String                 | Lokasi file PDF                                                           |
| status           | Enum                   | PENDING, APPROVED, REJECTED                                               |
| rejection_reason | String / Null          | Alasan jika ditolak                                                       |
| uploaded_at      | Date                   | Waktu file diunggah                                                       |
| reviewed_at      | Date / Null            | Waktu file direview                                                       |
|                  |                        | Role Guru                                                                 |
|                  | mengunggah_berkas      | Relationship / Associative Entity                                         |
| Atribut          | Tipe                   | Fungsi                                                                    |
| user_id          | ObjectId → users.\_id  | Guru yang mengunggah                                                      |
| berkas_id        | ObjectId → berkas.\_id | Berkas yang diunggah                                                      |
| uploaded_at      | Date                   | Waktu pengunggahan                                                        |
|                  |                        | Role Admin                                                                |
|                  | mereview_berkas        | Relationship / Associative Entity                                         |
| Atribut          | Tipe                   | Fungsi                                                                    |
| user_id          | ObjectId → users.\_id  | Admin yang melakukan review                                               |
| berkas_id        | ObjectId → berkas.\_id | Berkas yang direview                                                      |
| decision         | Enum                   | APPROVED atau REJECTED                                                    |
| reason           | String / Null          | Alasan review, terutama jika ditolak                                      |
| reviewed_at      | Date                   | Waktu review                                                              |
|                  |                        | Menyimpan bank soal matematika. Soal dianggap sebagai entitas             |
|                  | soal                   | Strong Entity utama karena menjadi objek yang digunakan dalam pretest dan |
|                  |                        | latihan.                                                                  |
| Atribut          | Tipe                   | Fungsi                                                                    |
| \_id             | ObjectId → soal.\_id   | Soal yang dihasilkan                                                      |
| berkas_id        | ObjectId → berkas.\_id | Berkas yang menjadi sumber soal                                           |
| subbab_id        | ObjectId → subbab.\_id | Menunjukkan soal termasuk subbab mana.                                    |
| kelas_id         | ObjectId → kelas.\_id  | Menunjukkan kelas yang menjadi target soal.                               |
| soal_text        | String                 | Isi soal.                                                                 |
| image_url        | Array String           | Menyimpan satu atau beberapa URL gambar yang digunakan pada soal.         |
| soal_type        | String                 | Jenis soal, misalnya multiple_choice.                                     |
| options          | Array Object           | Menyimpan pilihan jawaban.                                                |
| option_id        | String                 | Kode pilihan, misalnya A, B, C, D.                                        |
| text             | String                 | Isi pilihan jawaban.                                                      |
| correct_answer   | String                 | Jawaban yang benar.                                                       |
| cognitive_level  | String                 | Tingkat kognitif soal, yaitu C1 sampai C6 pakai EASY MEDIUM HARD          |
| cognitive_score  | Int32                  | Nilai tingkat kesulitan, misalnya 200 sampai 1200.                        |
| status           | String                 | Status soal, misalnya active atau inactive.                               |
| created_at       | Date                   | Waktu soal dibuat.                                                        |
| updated_at       | Date                   | Waktu soal diperbarui.                                                    |
| confidence_score | int32                  | Confidence score dari Generate Soal mengenai AKURASI                      |
