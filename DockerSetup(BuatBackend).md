# Panduan Setup Backend — Tim 2

Dokumentasi ini digunakan untuk melakukan setup dan menjalankan **Backend API Project Big Data** menggunakan Docker.

Backend menggunakan:

- Node.js
- Express.js
- MongoDB
- Mongoose
- Swagger
- Nodemon
- Docker & Docker Compose

---

## 1. Struktur Project

Project menggunakan struktur monorepo:

```text
project_assessment/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   └── ...
│
├── docker-compose.yml
└── .gitignore
```

Backend berada di folder:

```text
backend/
```

Docker Compose berada di root project:

```text
docker-compose.yml
```

---

# 2. Prasyarat

Pastikan aplikasi berikut sudah tersedia:

- Git
- Docker
- Docker Compose

Jika menggunakan Windows, disarankan menggunakan:

- WSL2
- Ubuntu
- Docker Desktop

Cek Docker:

```bash
docker --version
```

Cek Docker Compose:

```bash
docker compose version
```

Jika keduanya menampilkan versi, berarti Docker siap digunakan.

---

# 3. Clone Repository

Clone repository project:

```bash
git clone https://github.com/Project-Big-Data-26/project_assessment.git
```

Masuk ke project:

```bash
cd project_assessment
```

Pastikan berada di root project:

```bash
pwd
```

Struktur minimal:

```text
project_assessment/
├── backend/
└── frontend/
```

---

# 4. Konfigurasi Environment

Backend menggunakan file `.env` untuk menyimpan konfigurasi yang bersifat lokal/rahasia.

## 4.1 Buat `.env`

Masuk ke folder backend:

```bash
cd backend
```

Buat file:

```bash
cp .env.example .env
```

Kemudian edit:

```bash
nano .env
```

Untuk menggunakan MongoDB yang berjalan di Docker:

```env
PORT=5000
MONGO_URI=mongodb://mongodb:27017/project_assessment
```

Setelah selesai kembali ke root:

```bash
cd ..
```

---

# 5. Jangan Commit `.env`

File `.env` **tidak boleh di-push ke GitHub** karena dapat berisi credential database dan konfigurasi rahasia.

Pastikan `.gitignore` memiliki:

```gitignore
.env
backend/.env
node_modules/
```

Yang boleh masuk GitHub adalah:

```text
backend/.env.example
```

Contoh `.env.example`:

```env
PORT=5000
MONGO_URI=
```

Jangan menyimpan username/password MongoDB Atlas asli di `.env.example`.

---

# 6. Dockerfile Backend

File:

```text
backend/Dockerfile
```

digunakan untuk membuat container Node.js untuk backend.

Isi Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
```

Dependency backend akan di-install di dalam Docker menggunakan:

```bash
npm ci
```

Karena repository sudah memiliki:

```text
package-lock.json
```

maka versi dependency akan mengikuti lock file tersebut.

---

# 7. Docker Compose

File:

```text
docker-compose.yml
```

digunakan untuk menjalankan Backend dan MongoDB secara bersamaan.

Konfigurasi:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile

    container_name: project_assessment_backend

    ports:
      - "5000:5000"

    env_file:
      - ./backend/.env

    volumes:
      - ./backend:/app
      - backend_node_modules:/app/node_modules

    depends_on:
      - mongodb

  mongodb:
    image: mongo:8

    container_name: project_assessment_mongodb

    ports:
      - "27017:27017"

    volumes:
      - mongodb_data:/data/db

    restart: unless-stopped

volumes:
  mongodb_data:
  backend_node_modules:
```

Docker Compose akan menjalankan:

```text
Backend Express
      │
      │ Mongoose
      ▼
MongoDB
```

---

# 8. Menjalankan Backend

Dari root project:

```bash
docker compose up --build
```

Perintah `--build` digunakan pertama kali atau ketika terdapat perubahan pada Dockerfile/dependency.

Jika berhasil, akan muncul log seperti:

```text
🚀 Server jalan di http://localhost:5000
```

dan:

```text
✅ MongoDB Terhubung!
```

---

# 9. Menjalankan Setelah Setup Pertama

Jika image sudah pernah dibuat, cukup:

```bash
docker compose up
```

Tidak perlu menjalankan:

```bash
npm install
```

di komputer host.

Dependency Node.js sudah berada di dalam container.

---

# 10. Menjalankan di Background

Jika tidak ingin terminal terus menampilkan log:

```bash
docker compose up -d
```

Cek container:

```bash
docker compose ps
```

Contoh:

```text
NAME                         STATUS
project_assessment_backend   Up
project_assessment_mongodb   Up
```

---

# 11. Melihat Log

Untuk melihat log semua service:

```bash
docker compose logs -f
```

Hanya backend:

```bash
docker compose logs -f backend
```

Hanya MongoDB:

```bash
docker compose logs -f mongodb
```

---

# 12. Menghentikan Backend

Untuk menghentikan container:

```bash
docker compose down
```

Perintah ini **tidak menghapus data MongoDB**.

Data MongoDB disimpan pada Docker volume:

```text
mongodb_data
```

---

# 13. Menghapus Database Lokal

Jika ingin menghapus database MongoDB lokal beserta seluruh datanya:

```bash
docker compose down -v
```

**PERHATIAN:**

Perintah tersebut akan menghapus Docker volume MongoDB.

Akibatnya, seluruh database MongoDB lokal akan hilang.

Gunakan hanya jika memang ingin membuat database lokal dari awal.

---

# 14. Testing Backend

Setelah container berjalan, buka:

```text
http://localhost:5000
```

Backend memiliki basic route:

```http
GET /
```

Response:

```text
Server Backend Berjalan Mantap!
```

---

# 15. Swagger

Dokumentasi API tersedia di:

```text
http://localhost:5000/api-docs
```

Swagger digunakan untuk melihat dan mendokumentasikan endpoint API.

Endpoint Auth nantinya akan didokumentasikan di Swagger.

---

# 16. MongoDB

MongoDB lokal dapat diakses melalui:

```text
mongodb://localhost:27017
```

Namun perlu diperhatikan:

### Dari komputer/host

Gunakan:

```text
mongodb://localhost:27017
```

### Dari container backend

Gunakan:

```text
mongodb://mongodb:27017/project_assessment
```

Jangan menggunakan:

```text
mongodb://localhost:27017/project_assessment
```

dari dalam container backend.

Alasannya adalah `localhost` di dalam container menunjuk ke container backend itu sendiri.

Docker Compose menyediakan hostname:

```text
mongodb
```

yang menunjuk ke container MongoDB.

---

# 17. MongoDB Atlas

Project juga dapat menggunakan MongoDB Atlas.

Source code backend tidak perlu diubah.

Cukup ubah:

```env
MONGO_URI=mongodb://mongodb:27017/project_assessment
```

menjadi MongoDB Atlas URI:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/project_assessment
```

Dengan demikian:

```text
MongoDB Docker
        │
        │
        ├── Developer A
        │
        │
MongoDB Atlas
        │
        └── Developer B
```

Backend tetap menggunakan:

```js
process.env.MONGO_URI;
```

Jadi database dapat diganti melalui environment variable tanpa mengubah source code.

---

# 18. Rekomendasi Penggunaan Database Tim

Untuk development pribadi, developer dapat menggunakan:

```env
MONGO_URI=mongodb://mongodb:27017/project_assessment
```

Untuk menggunakan database bersama di cloud:

```env
MONGO_URI=mongodb+srv://...
```

Keduanya kompatibel dengan backend selama URI valid.

**Jangan memasukkan credential MongoDB Atlas ke GitHub.**

---

# 19. Hot Reload

Backend menggunakan Nodemon melalui:

```json
"dev": "nodemon index.js"
```

Docker Compose melakukan mount:

```yaml
volumes:
  - ./backend:/app
```

Artinya perubahan kode pada:

```text
backend/
```

akan terlihat oleh container.

Contohnya ketika mengubah:

```text
backend/index.js
```

Nodemon akan mendeteksi perubahan dan melakukan restart backend.

Tidak perlu melakukan:

```bash
docker compose down
```

setiap kali mengubah kode.

---

# 20. Kapan Harus Menggunakan `--build`?

### Hanya mengubah kode `.js`

Gunakan:

```bash
docker compose up
```

atau jika container sudah berjalan, tidak perlu melakukan apa-apa karena Nodemon akan restart.

### Mengubah `package.json`

Gunakan:

```bash
docker compose up --build
```

### Mengubah `package-lock.json`

Gunakan:

```bash
docker compose up --build
```

### Mengubah `Dockerfile`

Gunakan:

```bash
docker compose up --build
```

---

# 21. Instal Dependency Baru

Jangan melakukan instalasi dependency hanya di host jika project menggunakan Docker.

Misalnya ingin menambahkan:

```text
bcrypt
```

Kita akan memperbarui dependency backend dan kemudian melakukan rebuild:

```bash
docker compose up --build
```

Pastikan perubahan:

```text
package.json
package-lock.json
```

ikut di-commit ke Git.

---

# 22. Troubleshooting

## Port 5000 sudah digunakan

Jika muncul error seperti:

```text
port is already allocated
```

cek:

```bash
docker compose ps
```

atau:

```bash
sudo lsof -i :5000
```

Pastikan tidak ada aplikasi lain yang menggunakan port 5000.

---

## Container tidak berjalan

Cek:

```bash
docker compose ps
```

Kemudian:

```bash
docker compose logs backend
```

atau:

```bash
docker compose logs mongodb
```

---

## MongoDB tidak terhubung

Pastikan `.env` menggunakan:

```env
MONGO_URI=mongodb://mongodb:27017/project_assessment
```

bukan:

```env
MONGO_URI=mongodb://localhost:27017/project_assessment
```

jika backend menggunakan MongoDB Docker.

---

## Dependency bermasalah

Rebuild:

```bash
docker compose down
docker compose up --build
```

Jika masih bermasalah dan ingin membuat ulang volume dependency:

```bash
docker compose down
docker compose up --build
```

Jangan langsung menggunakan `down -v` karena volume MongoDB juga dapat terhapus.

---

# 23. Workflow Development Tim 2

Workflow yang direkomendasikan:

```text
Clone repository
       ↓
Buat backend/.env
       ↓
docker compose up --build
       ↓
Backend + MongoDB berjalan
       ↓
Coding
       ↓
Nodemon melakukan restart otomatis
       ↓
Testing dengan Thunder Client
       ↓
Dokumentasikan API di Swagger
       ↓
Commit perubahan
       ↓
Push ke GitHub
```

---

# 24. Perintah Docker yang Sering Digunakan

### Start

```bash
docker compose up
```

### Start + rebuild

```bash
docker compose up --build
```

### Start background

```bash
docker compose up -d
```

### Stop

```bash
docker compose down
```

### Lihat status

```bash
docker compose ps
```

### Lihat log

```bash
docker compose logs -f
```

### Masuk ke container backend

```bash
docker exec -it project_assessment_backend sh
```

### Masuk ke MongoDB

```bash
docker exec -it project_assessment_mongodb mongosh
```

---

# 25. Target Backend Tim 2

Setelah environment berhasil dijalankan, pengembangan API dilakukan secara bertahap.

### Authentication

```text
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/login
POST /api/auth/google
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Teknologi Auth

```text
Express.js
    ↓
Mongoose
    ↓
MongoDB
    ↓
bcrypt
    ↓
JWT
    ↓
Google Auth
    ↓
Nodemailer / Email OTP
```

Setiap endpoint API akan diuji menggunakan:

- Swagger
- Thunder Client

---

# 26. Catatan Keamanan

Jangan commit file berikut:

```text
.env
```

Jangan commit:

```text
MongoDB username
MongoDB password
JWT secret
Google OAuth secret
Email password/API key
```

Gunakan:

```text
.env
```

untuk konfigurasi lokal dan:

```text
.env.example
```

sebagai template tanpa credential asli.

Jika credential database pernah terlanjur masuk ke repository atau dibagikan secara publik, credential tersebut sebaiknya segera diganti/di-rotate.

---

## Selesai

Jika setup berhasil, kondisi yang diharapkan:

```text
Docker Compose
│
├── project_assessment_backend
│       └── Express API :5000
│
└── project_assessment_mongodb
        └── MongoDB :27017
```

Backend:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/api-docs
```

Setelah environment ini berhasil, Tim 2 dapat mulai mengembangkan **Auth API**.
