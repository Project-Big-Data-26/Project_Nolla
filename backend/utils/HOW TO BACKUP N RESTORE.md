Konfigurasi:
Instal *MongoDB Command Line Database Tools Download* 
Link: https://www.mongodb.com/try/download/app-services-cli

Tambah ke PATH Environment Variable:
1. Buka *Control Panel* > *System and Security* > *System* > *Advanced system settings* > *Environment Variables*
2. Pilih *Path* pada *System variables* > Klik *Edit* > Klik *New* > Masukkan path ke folder bin dari MongoDB Command Line Database Tools yang telah diinstal > Klik *OK*

Cek:
1. Buka *Command Prompt* > Ketik `mongodump --version` > Tekan *Enter*
2. Buka *Command Prompt* > Ketik `mongorestore --version` > Tekan *Enter*

CARA BACKUP:
1. Buka *Command Prompt* > Arahkan ke folder `backend` > Ketik `.\backup.bat` > Tekan *Enter*
2. Tunggu hingga proses backup selesai, file backup akan tersimpan di folder `backend/backups/`

CARA RESTORE:
1. Buka *Command Prompt* > Arahkan ke folder `backend` > Ketik `.\restore.bat` > Tekan *Enter*
2. Tunggu hingga proses restore selesai, data akan dipulihkan ke database MongoDB