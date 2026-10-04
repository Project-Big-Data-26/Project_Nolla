# API Testing (Postman)

Folder ini berisi hasil export Postman untuk API testing.

## Struktur

```
postman/
├── collections/
│   └── project-assessment.postman_collection.json   # export collection
└── environments/
    ├── local.postman_environment.example.json       # template (boleh di-commit)
    └── local.postman_environment.json               # isi asli, JANGAN di-commit
```

## Cara pakai

1. Postman → Import → pilih file di `collections/`.
2. Salin `local.postman_environment.example.json` menjadi `local.postman_environment.json`, isi `email` dan `password` akun uji, lalu Import ke Postman.
3. Jalankan backend (`http://localhost:5000`), pilih environment **Local**, lalu jalankan collection (Run collection).

## Aturan

- Jangan commit token, password, atau environment berisi data asli (sudah di-ignore lewat `postman/.gitignore`).
- Setiap kali collection diubah di Postman, export ulang (Collection v2.1) dan timpa file di `collections/`.
- Group request sesuai prefix API: `auth`, `dashboard`, `pretest`, `quiz`, `profile`, `personalization`, `learning-results`.

## Opsional: jalankan lewat CLI (Newman)

```bash
npx newman run postman/collections/project-assessment.postman_collection.json \
  -e postman/environments/local.postman_environment.json
```
