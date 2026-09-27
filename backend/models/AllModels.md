# Model Backend

Model aktif mengikuti `database-v1.md`.

## Data utama

- `User` -> `users`, termasuk `role`: `Siswa`, `Guru`, atau `Admin`
- `Jenjang` -> `jenjang`
- `Kelas` -> `kelas`
- `Bab` -> `bab`
- `Subbab` -> `subbab`
- `MemilikiPrasyarat` -> `memiliki_prasyarat`
- `Soal` -> `soal`

## Aktivitas siswa

- `MengerjakanPretest` -> `mengerjakan_pretest`
- `MenjawabSoalPretest` -> `menjawab_soal_pretest`
- `MendapatkanDifficulty` -> `mendapatkan_difficulty`
- `MengerjakanKuis` -> `mengerjakan_kuis`
- `MenjawabSoal` -> `menjawab_soal`
- `MenyelesaikanSubbab` -> `menyelesaikan_subbab`

## Peran guru dan admin

- `Berkas` -> `berkas`
- `MengunggahBerkas` -> `mengunggah_berkas`
- `MereviewBerkas` -> `mereview_berkas`

## Teknis autentikasi

- `RefreshToken`
- `OTP`
- `RevokedToken`

Model `Badge`, `Streak`, `UserPoint`, `UserBadge`, dan model lama yang sudah diganti tidak lagi digunakan.
