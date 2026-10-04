/// <reference types="cypress" />
// Test suite Landing Page — NOLLA
// Lokasi: frontend/cypress/e2e/landing/landing.cy.js
//
// Catatan: Landing Page belum tercatat sebagai use case resmi di UCS/SRS (dibahas
// terpisah dengan tim), jadi ID "CY-LANDING-xxx" di sini masih sementara/provisional,
// belum mengacu ke dokumen TC resmi seperti CY-LOGIN-xxx atau CY-PROFIL-xxx.
//
// Di luar cakupan file ini (sengaja tidak dites):
// - Section "Testimoni": disembunyikan dari UI (class "hidden" permanen di kode),
//   bukan bug, jadi tidak perlu dites visible.
// - Form Newsletter di footer: JSX-nya di-comment, belum aktif/belum dirender.
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
        cy.visit("/");
    });

    it("CY-LANDING-001 halaman utama (/) menampilkan Landing Page", () => {
        cy.location("pathname").should("eq", "/");
        cy.get("h1").should("contain.text", "Tingkatkan").and("contain.text", "Nilai Matematika");
        cy.get("img[alt=NOLLA]").should("be.visible");
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
    });

    it("CY-LANDING-003 CTA utama \"Mulai Belajar\" mengarah ke halaman Registrasi", () => {
        cy.get("header").contains("a", "Mulai Belajar").should("have.attr", "href", "/register").click();
        cy.location("pathname").should("eq", "/register");
    });

    it("CY-LANDING-004 tautan \"Lihat Cara Kerja\" men-scroll ke section Cara Kerja", () => {
        cy.window().its("scrollY").should("eq", 0);
        cy.contains("a", /^\s*Lihat Cara Kerja\s*$/).click();
        cy.location("pathname").should("eq", "/"); // scroll saja, tidak pindah halaman
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
    });

    it("CY-LANDING-007 FAQ: klik pertanyaan membuka jawabannya", () => {
        cy.contains("h2", "Pertanyaan umum").scrollIntoView();
        cy.contains("button", "Apa bedanya Nolla dengan bimbel online biasa?")
            .as("pertanyaan1")
            .click();
        cy.contains("skill drill adaptif").should("be.visible");
        // Buka pertanyaan lain: jawaban pertanyaan kedua ikut tampil
        cy.contains("button", "Apakah soalnya terus berulang?").click();
        cy.contains("Bank soal kami didukung oleh algoritma cerdas").should("be.visible");
    });

    it("CY-LANDING-008 section CTA bawah: tombol Daftar Sekarang & Masuk mengarah ke halaman yang benar", () => {
        cy.contains("h2", /ubah/i).and((el) => expect(el.text()).to.match(/takut/i));
        cy.get("#cta").within(() => {
            cy.contains("a", "Daftar Sekarang").should("have.attr", "href", "/register");
            cy.contains("a", "Sudah Punya Akun? Masuk").should("have.attr", "href", "/login");
        });
        cy.get("#cta").contains("a", "Sudah Punya Akun? Masuk").click();
        cy.location("pathname").should("eq", "/login");
    });

    it("CY-LANDING-009 footer: quick link FAQ men-scroll ke section FAQ, copyright tampil", () => {
        cy.contains("footer a", /^\s*FAQ\s*$/).click();
        cy.contains("h2", "Pertanyaan umum").should("be.visible");
        cy.contains("footer", "© 2026 NOLLA").should("be.visible");
    });
});

describe("Landing Page — menu mobile (pengunjung belum login)", () => {
    beforeEach(() => {
        cy.viewport(390, 844); // lebar ponsel, di bawah breakpoint md (768px)
        cy.clearAllLocalStorage();
        cy.visit("/");
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

    // TEMUAN BUG (ditemukan lewat test ini): tombol hamburger yang berubah jadi ikon X
    // saat drawer terbuka SEHARUSNYA bisa diklik lagi untuk menutup drawer, tapi
    // backdrop gelap (z-[90]) ternyata lebih tinggi dari navbar (z-50) tempat tombol
    // itu berada, jadi tombolnya ketutup backdrop dan tidak bisa diklik. Cara yang
    // benar-benar jalan sekarang cuma klik area backdrop di luar drawer.
    it("CY-LANDING-011 BUG: tombol X untuk menutup drawer ketutup backdrop, tidak bisa diklik", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Kenapa Nolla").should("be.visible");
        // Tidak memakai {force:true} di sini: itu akan memaksa klik tetap terkirim ke
        // tombolnya walau ketutup secara visual, sehingga bug ini malah tidak kebukti.
        // Sebagai gantinya, cek langsung elemen apa yang benar-benar ada di titik tombol itu.
        cy.get('[aria-label="Buka navigasi menu"]').then(($tombol) => {
            const r = $tombol[0].getBoundingClientRect();
            const x = r.left + r.width / 2;
            const y = r.top + r.height / 2;
            cy.document().then((doc) => {
                const elemenPalingAtas = doc.elementFromPoint(x, y);
                const tombolBisaDiklik = $tombol[0].contains(elemenPalingAtas) || elemenPalingAtas === $tombol[0];
                expect(tombolBisaDiklik, "tombol hamburger bisa diklik (tidak ketutup elemen lain)").to.equal(false);
            });
        });
    });

    it("CY-LANDING-011b drawer bisa ditutup lewat klik area backdrop", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Kenapa Nolla").should("be.visible");
        cy.get('div[aria-hidden="true"]').click({ force: true }); // backdrop gelap di luar panel drawer
        cy.contains("button", "Kenapa Nolla").should("not.be.visible");
    });

    it("CY-LANDING-012 drawer: klik link navigasi ikut men-scroll dan menutup drawer", () => {
        cy.get('[aria-label="Buka navigasi menu"]').click();
        cy.contains("button", "Cara Kerja").click();
        cy.contains("h2", "3 langkah meningkatkan kemampuan").should("be.visible");
        cy.contains("button", "Kenapa Nolla").should("not.be.visible"); // drawer sudah tertutup
    });
});

describe("Landing Page — siswa sudah login", () => {
    it("CY-LANDING-013 navbar menampilkan \"Buka Topik Belajar\" dan mengarah ke /topik", () => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.visit("/");
        cy.contains("a", /^\s*Masuk\s*$/).should("not.exist");
        cy.contains("a", /^\s*Daftar Sekarang\s*$/).should("not.exist");
        cy.contains("button", /^\s*Buka Topik Belajar\s*$/).should("be.visible").click();
        cy.location("pathname").should("eq", "/topik");
    });
});
