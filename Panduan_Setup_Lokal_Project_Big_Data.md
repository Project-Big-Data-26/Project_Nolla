PANDUAN LEBIH JELAS MELALUI FILE WORD Panduan_Setup_Lokal_Project_Big_Data.docx

# **Panduan Setup Lokal Project Big Data** 

#### **Logic & Data Set Up** 

Berikut adalah Standard Operating Procedure (SOP) untuk melakukan setup repositori proyek di laptop masing-masing. 

Pastikan aplikasi berikut sudah terinstal sebelum memulai: 

• Node.js 

• Git 

## **📍 Langkah 1 — Clone Repository** 

Buka Terminal (Git Bash / Command Prompt / PowerShell) di folder tempat kalian biasa menyimpan tugas kuliah. Kemudian jalankan perintah berikut: 

```
# 1. Download repository dari GitHub
```

```
git clone https://github.com/Project-Big-Data-26/project_assessment.git
```

```
# 2. Masuk ke dalam folder utama proyek
cd project_assessment
```

## **📍 Langkah 2 — Setup Backend (Dapur API & Database)** 

### **2.1 Masuk ke Folder Backend** 

```
cd backend
```

### **2.2 Install Library Utama** 

Jalankan perintah berikut untuk menginstal library yang dibutuhkan: 

```
npm install express mongoose cors dotenv swagger-ui-express swagger-jsdoc
```

### **2.3 Install Nodemon** 

Nodemon digunakan khusus untuk environment development, sehingga server akan otomatis melakukan restart ketika terdapat perubahan pada kode. 

```
npm install -D nodemon
```

📚 **Penjelasan Library yang Diinstal** 

|Library|Fungsi|
|---|---|
|express|Framework utama untuk membuat API.|
|mongoose|Alat untuk menyambungkan Node.js<br>dengan MongoDB dan membuat skema<br>(ERD).|
|cors|Izin keamanan agar UI Frontend (React)|
||bisa menarik data dari Backend.|
|---|---|
|dotenv|Alat untuk membaca file rahasia .env.|
|swagger-ui-express & swagger-jsdoc|Alat untuk membuat halaman dokumentasi<br>API (/api-docs).|
|nodemon|Mesin server development yang otomatis<br>restart ketika ada kodingan yang di-save.|



## **📍 Langkah 3 — Konfigurasi File Rahasia (.env)** 

File .env berisi kunci rahasia untuk masuk ke MongoDB Atlas. 

File ini tidak tersedia di GitHub karena disembunyikan, sehingga setiap anggota tim harus membuatnya secara manual berdasarkan template yang sudah disediakan. 

Pastikan posisi Terminal / VS Code kalian masih berada di dalam folder backend. 

Langkah yang perlu dilakukan: 

1. Cari file bernama .env.example. 

2. Copy file tersebut. 

3. Ganti nama hasil copy menjadi .env (tanpa kata example). 

4. Buka file .env tersebut. 

5. Isi konfigurasi sesuai format yang sudah disediakan pada template. 

## **📍 Langkah 4 — Setup Frontend (UI React)** 

### **4.1 Kembali ke Folder Utama Project** 

```
cd ..
```

### **4.2 Masuk ke Folder Frontend** 

```
cd frontend
```

### **4.3 Install Semua Dependency React** 

```
npm install
```

Perintah tersebut akan menginstal semua bawaan React dari Tim 1. 

## **📍 Langkah 5 — Cara Menyalakan Server (Run Project)** 

Untuk mengerjakan proyek ini, disarankan membuka 2 terminal: 

• Terminal 1 → Backend 

• Terminal 2 → Frontend 

**Terminal 1 — Menyalakan Backend (API & Database) �** 🖥️� Masuk ke folder backend: 

```
cd backend
```

Kemudian jalankan: 

```
npm run dev
```

### **✅ Tanda Backend Berhasil** 

Jika berhasil, terminal akan menampilkan tulisan seperti: 

```
🚀 Server jalan di http://localhost:5000
```

```
🚀 MongoDB Terhubung!
```

##### Artinya: 

- 🚀 Server Backend/API sudah berjalan. 

- 🚀 Backend sudah berhasil terhubung ke MongoDB. 

### **✅ Terminal 2 — Menyalakan Frontend (React UI)** 

Masuk ke folder frontend: 

```
cd frontend
```

Kemudian jalankan: 

```
npm start
```

Catatan: Jika Tim 1 menggunakan Vite, gunakan perintah: 

```
npm run dev
```

## **📍 Ringkasan Alur Setup** 

```
Clone Repository
       ↓
Masuk ke project_assessment
       ↓
Setup Backend
       ↓
Install Dependencies
       ↓
Buat & Konfigurasi .env
       ↓
Setup Frontend
       ↓
Install Dependencies
       ↓
Buka 2 Terminal
       ↓
Backend → npm run dev
Frontend → npm start / npm run dev
       ↓
🚀 Project Siap Digunakan!
```

