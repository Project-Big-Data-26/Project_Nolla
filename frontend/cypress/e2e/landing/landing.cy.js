/// <reference types="cypress" />
// Test suite Landing Page — NOLLA
// Lokasi: frontend/cypress/e2e/landing/landing.cy.js
//
// Catatan: Landing Page ada di route /nolla ("/" kini halaman Topics yang butuh login).
//
// Catatan: Landing Page = use case "Mengakses Landing Page" (UC08). ID "CY-LANDING-xxx"
// di file ini masih sementara; pasangan tiap test dengan baris Excel ada di kolom
// "Cara Eksekusi" sheet TC-Landing.
//
// Di luar cakupan file ini (sengaja tidak dites):
// - Section "Testimoni": disembunyikan dari UI (class "hidden" permanen di kode),
//   bukan bug, jadi tidak perlu dites visible.
// - Form Newsletter di footer: JSX-nya di-comment, belum aktif/belum dirender.
// - Tombol "Lihat Topik SD/SMP/SMA" di section Jenjang: sudah dihilangkan dari UI,
//   hanya dicek tidak ada (CY-LANDING-006), bukan dites fungsinya.
// - Animasi, parallax, dan elemen dekoratif (gambar mengambang, dll): tidak
//   mempengaruhi fungsi, tidak dites.
//
// Prasyarat:
// - Frontend jalan sesuai baseUrl di cypress.config.js.
// - Backend jalan (untuk CY-LANDING-012, perlu login akun asli).
// - AKUN-01 (lihat frontend/cypress.env.json) dipakai untuk CY-LANDING-012.

const AKUN01 = {
    email: Cypress.env("AKUN01_EMAIL"),
    password: Cypress.env("AKUN01_PASSWORD"),
};

function loginViaUi(email, password) {
    cy.intercept("POST", "**/api/auth/login").as("login");
    cy.visit("/login");
    cy.get('input[name="email"]').clear().type(email);
    cy.get('input[name="password"]').clear().type(password, { log: false });
    cy.contains("button", /^Masuk$/).click();
    cy.wait("@login").its("response.statusCode").should("be.within", 200, 299);
    cy.location("pathname").should("eq", "/topik");
}

describe("Landing Page — tampilan umum (pengunjung belum login)", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        cy.visit("/nolla");
    });

    it("CY-LANDING-001 halaman /nolla menampilkan Landing Page", () => {
        cy.location("pathname").should("eq", "/nolla");
        cy.get("h1").should("contain.text", "Tingkatkan").and("contain.text", "Nilai Matematika");
        // Logo kini gambar dekoratif (alt="") + teks "NOLLA" di dalam tombol logo navbar.
        cy.get('nav button[title="Kembali ke atas"]').should("be.visible").and("contain.text", "NOLLA");
        cy.get('nav button[title="Kembali ke atas"] img').should("be.visible");
        // "Mulai Belajar" & tombol lain berisi panah "›" di <span> terpisah,
        // jadi dicocokkan sebagai substring (bukan regex ^$), bukan karena typo.
        cy.get("header").contains("a", "Mulai Belajar").should("be.visible");
        cy.get("header").contains("a", "Lihat Cara Kerja").should("be.visible");
    });

    it("CY-LANDING-002 navbar menampilkan tombol Masuk & Daftar Sekarang yang mengarah ke halaman yang benar", () => {
        cy.get("nav").within(() => {
            cy.contains("a", "Masuk").should("be.visible").and("have.attr", "href", "/login");
            cy.contains("a", "Daftar Sekarang").should("be.visible").and("have.attr", "href", "/register");
        });
        cy.get("nav").contains("a", "Masuk").click();
        cy.location("pathname").should("eq", "/login");
        cy.visit("/nolla");
        cy.get("nav").contains("a", "Daftar Sekarang").click();
        cy.location("pathname").should("eq", "/register");
    });

    it("CY-LANDING-003 CTA utama \"Mulai Belajar\" mengarah ke halaman Registrasi", () => {
        cy.get("header").contains("a", "Mulai Belajar").should("have.attr", "href", "/register").click();
        cy.location("pathname").should("eq", "/register");
    });

    it("CY-LANDING-004 tautan \"Lihat Cara Kerja\" men-scroll ke section Cara Kerja", () => {
        cy.window().its("scrollY").should("eq", 0);
        cy.contains("a", /^\s*Lihat Cara Kerja\s*$/).click();
        cy.location("pathname").should("eq", "/nolla"); // scroll saja, tidak pindah halaman
        cy.location("hash").should("eq", "#cara"); // tombol ini anchor biasa, jadi URL jadi /nolla#cara
        cy.window().its("scrollY").should("be.greaterThan", 0);
        cy.contains("h2", "3 langkah meningkatkan kemampuan").should("be.visible");
    });

    it("CY-LANDING-005 navbar desktop: tiap link men-scroll ke section yang sesuai", () => {
        const tautan = [
            ["Kenapa Nolla", "Kenapa matematika terasa menakutkan?"],
            ["Cara Kerja", "3 langkah meningkatkan kemampuan"],
            ["Jenjang", "Belajar Sesuai Jenjangmu"],
            ["Keunggulan", "Skill drill, bukan sekadar ujian"],
            ["FAQ", "Pertanyaan umum"],
        ];
        tautan.forEach(([label, judulSection]) => {
            cy.contains("nav a", new RegExp(`^\\s*${label}\\s*$`)).click();
            cy.contains("h2", judulSection).should("be.visible");
        });
    });

    it("CY-LANDING-006 semua section utama tampil dengan judul yang sesuai", () => {
        [
            "Kenapa matematika terasa menakutkan?",
            "3 langkah meningkatkan kemampuan",
            "Belajar Sesuai Jenjangmu",
            "Skill drill, bukan sekadar ujian",
            "Pertanyaan umum",
        ].forEach((judul) => {
            cy.contains("h2", judul).scrollIntoView().should("be.visible");
        });
        // Jenjang: 3 kartu SD, SMP, SMA tampil dengan rentang kelasnya
        cy.contains("h3", "Sekolah Dasar (SD)").should("be.visible");
        cy.contains("h3", "Sekolah Menengah Pertama (SMP)").should("be.visible");
        cy.contains("h3", "Sekolah Menengah Atas (SMA)").should("be.visible");
        // Tombol "Lihat Topik SD/SMP/SMA" di kartu jenjang sudah dihilangkan dari UI (di-comment di kode).
        cy.contains("a, button", /Lihat Topik/).should("not.exist");
    });

    it("CY-LANDING-007 FAQ: satu jawaban terbuka dalam satu waktu dan bisa ditutup kembali", () => {
        cy.contains("h2", "Pertanyaan umum").scrollIntoView();
        const jawaban1 = () => cy.get("#faq").contains("skill drill adaptif");
        const jawaban2 = () => cy.get("#faq").contains("Bank soal kami didukung oleh algoritma cerdas");
        cy.get("#faq").contains("button", "Apa bedanya Nolla dengan bimbel online biasa?").click();
        jawaban1().should("be.visible");
        // Accordion: membuka pertanyaan 2 menutup pertanyaan 1 (jawaban tertutup = opacity 0)
        cy.get("#faq").contains("button", "Apakah soalnya terus berulang?").click();
        jawaban2().should("be.visible");
        jawaban1().should("not.be.visible");
        // Klik pertanyaan yang sama menutup jawabannya
        cy.get("#faq").contains("button", "Apakah soalnya terus berulang?").click();
        jawaban2().should("not.be.visible");
    });

    it("CY-LANDING-008 section CTA bawah: tombol Daftar Sekarang & Masuk mengarah ke halaman yang benar", () => {
        cy.contains("h2", /ubah/i).and((el) => expect(el.text()).to.match(/takut/i));
        cy.get("#cta").within(() => {
            cy.contains("a", "Daftar Sekarang").should("have.attr", "href", "/register");
            cy.contains("a", "Sudah Punya Akun? Masuk").should("have.attr", "href", "/login");
        });
        cy.get("#cta").contains("a", "Sudah Punya Akun? Masuk").click();
        cy.location("pathname").should("eq", "/login");
        cy.visit("/nolla");
        cy.get("#cta").contains("a", "Daftar Sekarang").scrollIntoView().click();
        cy.location("pathname").should("eq", "/register");
    });

    it("CY-LANDING-009 footer: quick link FAQ men-scroll ke section FAQ, copyright tampil", () => {
        cy.contains("footer a", /^\s*FAQ\s*$/).click();
        cy.contains("h2", "Pertanyaan umum").should("be.visible");
        cy.contains("footer", "© 2026 NOLLA").should("be.visible");
    });

    it("CY-LANDING-017 klik logo NOLLA di navbar mengembalikan halaman ke paling atas", () => {
        cy.scrollTo("bottom");
        cy.window().its("scrollY").should("be.greaterThan", 0);
        cy.get('nav button[title="Kembali ke atas"]').click();
        // Toleransi < 20px: saat kembali ke atas navbar membesar lagi (py-3 → py-4) dan browser
        // bisa menyisakan beberapa px (run headless 5 Okt: berhenti di 6.5px). < 20px = dianggap di atas.
        cy.window().its("scrollY").should("be.lessThan", 20);
    });
});

describe("Landing Page — menu mobile (pengunjung belum login)", () => {
    beforeEach(() => {
        cy.viewport(390, 844); // lebar ponsel, di bawah breakpoint md (768px)
        cy.clearAllLocalStorage();
        cy.visit("/nolla");
    });

    it("CY-LANDING-010 menu hamburger membuka drawer berisi navigasi dan CTA", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Kenapa Nolla").should("be.visible");
        cy.contains("button", "Cara Kerja").should("be.visible");
        cy.contains("button", "Jenjang").should("be.visible");
        cy.contains("button", "Keunggulan").should("be.visible");
        cy.contains("button", "FAQ").should("be.visible");
        // "Masuk"/"Daftar Sekarang" juga ada di navbar desktop (tersembunyi lewat CSS
        // di lebar ini); filter :visible supaya yang ketemu pasti milik drawer.
        cy.contains("a:visible", "Masuk").should("have.attr", "href", "/login");
        cy.contains("a:visible", "Daftar Sekarang").should("have.attr", "href", "/register");
    });

    // Sebelumnya BUG: tombol hamburger yang berubah jadi ikon X saat drawer terbuka ketutup
    // backdrop gelap (z-[90]) karena navbar hanya z-50, sehingga drawer tidak bisa ditutup
    // lewat tombol itu. Sudah diperbaiki developer (navbar sekarang z-[95]); test ini
    // menjadi regresi: tombol harus bisa diklik tanpa {force:true} dan menutup drawer.
    it("CY-LANDING-011 tombol X bisa diklik (tidak ketutup backdrop) dan menutup drawer", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Kenapa Nolla").should("be.visible");
        cy.get('[aria-label="Buka navigasi menu"]').then(($tombol) => {
            const r = $tombol[0].getBoundingClientRect();
            cy.document().then((doc) => {
                const elemenPalingAtas = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                expect(
                    $tombol[0].contains(elemenPalingAtas),
                    "tombol hamburger tidak ketutup elemen lain",
                ).to.equal(true);
            });
        });
        cy.get('[aria-label="Buka navigasi menu"]').click(); // tanpa force: gagal kalau ketutup
        cy.contains("button", "Kenapa Nolla").should("not.be.visible");
    });

    it("CY-LANDING-011b drawer bisa ditutup lewat klik area backdrop", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Kenapa Nolla").should("be.visible");
        // Klik di sisi kanan layar (di luar panel drawer selebar 76%), tanpa force:
        // pastikan dulu elemen paling atas di titik itu memang backdrop.
        const x = 370, y = 600;
        cy.document().then((doc) => {
            expect(doc.elementFromPoint(x, y).getAttribute("aria-hidden"), "titik klik = backdrop").to.equal("true");
        });
        cy.get("body").click(x, y);
        cy.contains("button", "Kenapa Nolla").should("not.be.visible");
    });

    it("CY-LANDING-012 drawer: klik link navigasi ikut men-scroll dan menutup drawer", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Cara Kerja").click();
        cy.contains("h2", "3 langkah meningkatkan kemampuan").should("be.visible");
        cy.contains("button", "Kenapa Nolla").should("not.be.visible"); // drawer sudah tertutup
    });

    it("CY-LANDING-020 halaman di belakang terkunci saat drawer terbuka dan lepas setelah ditutup", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.get("body").should(($b) => expect($b[0].style.overflow).to.equal("hidden"));
        cy.get('[aria-label="Buka navigasi menu"]').click(); // tombol X
        cy.get("body").should(($b) => expect($b[0].style.overflow).to.equal(""));
    });
});

describe("Landing Page — siswa sudah login", () => {
    it("CY-LANDING-013 navbar menampilkan \"Buka Topik Belajar\" dan mengarah ke /topik", () => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.visit("/nolla");
        // Cek tombol login dulu supaya "tidak ada" di bawah tidak lolos sebelum status login terbaca.
        // Dibatasi ke <nav>: hero & CTA bawah memang tetap menampilkan Mulai Belajar / Daftar Sekarang.
        cy.get("nav").contains("button", /^\s*Buka Topik Belajar\s*$/).should("be.visible");
        cy.get("nav").contains("a", "Masuk").should("not.exist");
        cy.get("nav").contains("a", "Daftar Sekarang").should("not.exist");
        cy.get("nav").contains("button", /^\s*Buka Topik Belajar\s*$/).click();
        cy.location("pathname").should("eq", "/topik");
    });
});

describe("Landing Page — siswa sudah login menekan tombol daftar/masuk", () => {
    // Hero & CTA bawah tetap tampil untuk siswa login. Karena sudah login, ketiganya
    // langsung membuka Bab Pembelajaran (/topik), bukan halaman registrasi/login.
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.visit("/nolla");
    });

    it("CY-LANDING-014 hero \"Mulai Belajar\" langsung membuka /topik", () => {
        cy.get("header").contains("a", "Mulai Belajar").click();
        cy.location("pathname").should("eq", "/topik");
    });

    it("CY-LANDING-015 CTA bawah \"Daftar Sekarang\" langsung membuka /topik", () => {
        cy.get("#cta").contains("a", "Daftar Sekarang").scrollIntoView().click();
        cy.location("pathname").should("eq", "/topik");
    });

    it("CY-LANDING-016 CTA bawah \"Sudah Punya Akun? Masuk\" langsung membuka /topik", () => {
        cy.get("#cta").contains("a", "Sudah Punya Akun? Masuk").scrollIntoView().click();
        cy.location("pathname").should("eq", "/topik");
    });

    it("CY-LANDING-018 klik logo NOLLA saat sudah login mengembalikan halaman ke paling atas", () => {
        cy.scrollTo("bottom");
        cy.window().its("scrollY").should("be.greaterThan", 0);
        cy.get('nav button[title="Kembali ke atas"]').click();
        // Toleransi < 20px: saat kembali ke atas navbar membesar lagi (py-3 → py-4) dan browser
        // bisa menyisakan beberapa px (run headless 5 Okt: berhenti di 6.5px). < 20px = dianggap di atas.
        cy.window().its("scrollY").should("be.lessThan", 20);
        cy.location("pathname").should("eq", "/nolla");
    });

    it("CY-LANDING-019 drawer mobile menampilkan \"Buka Topik Belajar\" dan mengarah ke /topik", () => {
        cy.viewport(390, 844);
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Kenapa Nolla").closest("div.fixed").as("drawer");
        cy.get("@drawer").contains("button", "Buka Topik Belajar").should("be.visible");
        cy.get("@drawer").contains("a", "Masuk").should("not.exist");
        cy.get("@drawer").contains("a", "Daftar Sekarang").should("not.exist");
        cy.get("@drawer").contains("button", "Buka Topik Belajar").click();
        cy.location("pathname").should("eq", "/topik");
    });
});

describe("Landing Page — sesi tidak valid & path /", () => {
    it("CY-LANDING-021 token login rusak: Landing Page masih menganggap login, tapi /topik menolak dan membawa ke halaman Masuk", () => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        // Rusak semua key berisi "token" di localStorage (accessToken, refreshToken)
        cy.window().then((win) => {
            const keys = Object.keys(win.localStorage).filter((k) => /token/i.test(k));
            expect(keys, "key token di localStorage").to.not.be.empty;
            cy.log(`Key token yang dirusak: ${keys.join(", ")}`);
            keys.forEach((k) => win.localStorage.setItem(k, "rusak123"));
        });
        cy.visit("/nolla");
        // Perilaku aplikasi (5 Okt 2026): Landing Page hanya mengecek token ADA, bukan masih berlaku,
        // jadi navbar tetap menampilkan "Buka Topik Belajar" (temuan, dicatat di TC).
        cy.get("nav").contains("button", "Buka Topik Belajar").should("be.visible").click();
        // Halaman yang butuh login menolak token rusak dan membawa ke halaman Masuk (seperti CY-LOGIN-035)
        cy.contains("Masuk ke Akun Anda").should("be.visible");
        cy.location("pathname").then((p) => cy.log(`Diarahkan ke ${p}`));
    });

    it("CY-LANDING-022 pengunjung membuka / tidak bisa melihat halaman Topik", () => {
        cy.clearAllLocalStorage();
        cy.visit("/");
        // Tujuan pasti belum diputuskan; dua kemungkinan yang wajar diterima, hasilnya dicatat di log.
        cy.location("pathname").should("be.oneOf", ["/login", "/nolla"]);
        cy.location("pathname").then((p) => cy.log(`Pengunjung diarahkan ke ${p}`));
    });
});