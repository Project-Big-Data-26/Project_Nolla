# API Testing (Postman)

Folder ini berisi hasil export Postman untuk API testing.

## Struktur

Dikelompokkan per fitur, sama seperti `frontend/cypress/e2e/` (huruf kecil, kebab-case).

```
postman/
├── collections/
│   └── profil/
│       └── profil.postman_collection.json            # TC-Profil (PM-PROFIL-001 s.d. 023)
└── environments/
    └── local-profil.postman_environment.example.json # template (boleh di-commit)
```

Fitur baru: buat folder baru di `collections/` (mis. `login/login.postman_collection.json`).

## Cara pakai

1. Postman → Import → pilih file di `collections/`.
2. Import `environments/local-profil.postman_environment.example.json`, lalu isi password akun uji langsung di Postman (jangan di file).
3. Jalankan backend (`http://localhost:5000`), pilih environment **Local**, lalu jalankan collection (Run collection).

## Aturan

- Jangan commit token, password, atau environment berisi data asli (sudah di-ignore lewat `postman/.gitignore`).
- Setiap kali collection diubah di Postman, export ulang (Collection v2.1) dan timpa file di `collections/`.
- Group request sesuai prefix API: `auth`, `dashboard`, `pretest`, `quiz`, `profile`, `personalization`, `learning-results`.

## Opsional: jalankan lewat CLI (Newman)

```bash
npx newman run postman/collections/profil/profil.postman_collection.json \
  -e postman/environments/local-profil.postman_environment.example.json
```
