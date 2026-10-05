/// <reference types="cypress" />
// Test suite Hasil Pembelajaran (UC05: Melihat Hasil Pembelajaran) — NOLLA
// Lokasi: frontend/cypress/e2e/hasil-pembelajaran/hasil-pembelajaran.cy.js
// Acuan: SRS F05.1–F05.3 (UC05 Melihat Hasil Pembelajaran). Belum ada dokumen TC
// resmi, jadi ID "CY-HASIL-xxx" di sini masih sementara/provisional.
//
// Sejak 5 Okt 2026 halaman ini (TopicDetailPage.jsx) memuat data dari backend lewat
// GET /api/learning-results, tidak lagi memakai data dummy di kode.
//
// Susunan spec:
// - Blok "data asli": memakai respons backend apa adanya. Per 6 Okt 2026 AKUN-01 belum
//   punya BAB berprogres (summary 0/0, daftar kosong), jadi test di blok ini TIDAK
//   bergantung pada nama/angka tertentu; yang dicek: ringkasan & jumlah kartu cocok
//   dengan respons API.
// - Blok "data tiruan": respons /learning-results di-stub lewat cy.intercept supaya
//   kartu, pencarian, filter, dan ringkasan bisa dites dengan data yang pasti.
//
// Prasyarat: frontend & backend jalan, AKUN-01 (lihat cypress.env.json) dipakai login.

const AKUN01 = {
    email: Cypress.env("AKUN01_EMAIL"),
    password: Cypress.env("AKUN01_PASSWORD"),
};

const PLACEHOLDER_CARI = "Search bab atau topik pembelajaran...";
const PESAN_KOSONG = "Tidak ada bab yang cocok dengan pencarian/filter.";

function loginViaUi(email, password) {
    cy.intercept("POST", "**/api/auth/login").as("login");
    cy.visit("/login");
    cy.get('input[name="email"]').clear().type(email);
    cy.get('input[name="password"]').clear().type(password, { log: false });
    cy.contains("button", /^Masuk$/).click();
    cy.wait("@login").its("response.statusCode").should("be.within", 200, 299);
    cy.location("pathname").should("eq", "/topik");
}

// Data tiruan: sengaja tidak berurutan (display_order 3, 1, 2) untuk menguji pengurutan.
const BAB_SELESAI = {
    id: "mock-hasil-1",
    name: "BAB Tiruan Pecahan Dasar",
    description: "Mengenal pecahan senilai.",
    display_order: 1,
    status: "completed",
    progress: 100,
    total_subbab: 3,
    started_subbab: 3,
    completed_subbab: 3,
    class_reference: "Kelas 3",
};
const BAB_PROSES_A = {
    id: "mock-hasil-2",
    name: "BAB Tiruan Bilangan Bulat",
    description: "Operasi hitung bilangan bulat.",
    display_order: 2,
    status: "in_progress",
    progress: 60,
    total_subbab: 5,
    started_subbab: 4,
    completed_subbab: 2,
    class_reference: "Kelas 4",
};
const BAB_PROSES_B = {
    id: "mock-hasil-3",
    name: "BAB Tiruan Operasi Pecahan",
    description: "Menjumlahkan dan mengurangkan pecahan.",
    display_order: 3,
    status: "in_progress",
    progress: 35,
    total_subbab: 4,
    started_subbab: 2,
    completed_subbab: 1,
    class_reference: "Kelas 4",
};
const RINGKASAN_TIRUAN = { completed_bab: 1, in_progress_bab: 2 };

function stubHasilPembelajaran(opsi = {}) {
    cy.intercept("GET", "**/api/learning-results", {
        statusCode: 200,
        delay: opsi.delay || 0,
        body: {
            statusCode: 200,
            success: true,
            message: "Hasil pembelajaran berhasil diambil.",
            summary: RINGKASAN_TIRUAN,
            data: [BAB_PROSES_B, BAB_SELESAI, BAB_PROSES_A],
        },
    }).as("hasil");
}

function bukaHalamanDenganDataTiruan() {
    cy.viewport(1280, 900);
    cy.clearAllLocalStorage();
    loginViaUi(AKUN01.email, AKUN01.password);
    stubHasilPembelajaran(); // didaftarkan sebelum halaman dibuka
    cy.visit("/hasil-pembelajaran");
    cy.wait("@hasil");
}

function pilihFilter(opsi) {
    cy.contains("button", "Filters").click();
    cy.contains('[class*="absolute"] button', new RegExp(`^${opsi}$`)).click();
}

describe("Hasil Pembelajaran: tampilan umum (data asli AKUN-01)", () => {
    it("CY-HASIL-001 halaman tidak bisa dibuka tanpa login", () => {
        cy.clearAllLocalStorage();
        cy.visit("/hasil-pembelajaran");
        cy.location("pathname").should("eq", "/login");
    });

    it("CY-HASIL-002 halaman menampilkan judul & ringkasan hasil belajar (F05.1)", () => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.intercept("GET", "**/api/learning-results").as("hasilAsli");
        cy.visit("/hasil-pembelajaran");
        cy.wait("@hasilAsli").then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            const { summary, data } = response.body;
            cy.location("pathname").should("eq", "/hasil-pembelajaran");
            cy.contains("h1", "Hasil Pembelajaran").should("be.visible");
            cy.contains("article", "BAB Selesai Dipelajari").should("contain.text", String(summary.completed_bab));
            cy.contains("article", "BAB Sedang Dipelajari").should("contain.text", String(summary.in_progress_bab));
            // Jumlah kartu mengikuti jumlah data dari API (kosong -> pesan kosong tampil).
            if (data.length === 0) {
                cy.contains(PESAN_KOSONG).should("be.visible");
            } else {
                cy.get("section article h3").should("have.length", data.length);
            }
        });
    });
});

describe("Hasil Pembelajaran: kartu BAB (data tiruan)", () => {
    beforeEach(bukaHalamanDenganDataTiruan);

    it("CY-HASIL-003 setiap kartu BAB menampilkan nomor, nama, deskripsi, progres, jumlah subbab, dan kelas (F05.1)", () => {
        cy.contains("article h3", BAB_SELESAI.name)
            .parents("article")
            .within(() => {
                cy.contains("BAB 1").should("be.visible");
                cy.contains(BAB_SELESAI.description).should("be.visible");
                cy.contains("3 dari 3 subbab dimulai").should("be.visible");
                cy.contains("3 dari 3 subbab selesai").should("be.visible");
                cy.contains("100%").should("be.visible");
                cy.contains("Kelas 3").should("be.visible");
            });
        cy.contains("article h3", BAB_PROSES_A.name)
            .parents("article")
            .within(() => {
                cy.contains("4 dari 5 subbab dimulai").should("be.visible");
                cy.contains("2 dari 5 subbab selesai").should("be.visible");
                cy.contains("60%").should("be.visible");
            });
    });

    it("CY-HASIL-004 kartu BAB diurutkan menurut nomor BAB", () => {
        cy.get("section article h3").then(($judul) => {
            const urutan = [...$judul].map((el) => el.textContent.trim());
            expect(urutan).to.deep.equal([BAB_SELESAI.name, BAB_PROSES_A.name, BAB_PROSES_B.name]);
        });
    });

    it("CY-HASIL-005 ringkasan BAB Selesai & Sedang Dipelajari sesuai data (F05.1)", () => {
        cy.contains("article", "BAB Selesai Dipelajari").should("contain.text", String(RINGKASAN_TIRUAN.completed_bab));
        cy.contains("article", "BAB Sedang Dipelajari").should("contain.text", String(RINGKASAN_TIRUAN.in_progress_bab));
    });
});

describe("Hasil Pembelajaran: pencarian (data tiruan)", () => {
    beforeEach(bukaHalamanDenganDataTiruan);

    it("CY-HASIL-006 pencarian menyaring daftar BAB berdasarkan nama", () => {
        cy.get(`input[placeholder="${PLACEHOLDER_CARI}"]`).type("Bilangan Bulat");
        cy.contains("article h3", BAB_PROSES_A.name).should("be.visible");
        cy.get("section article h3").should("have.length", 1);
    });

    it("CY-HASIL-007 pencarian juga mencocokkan deskripsi BAB", () => {
        cy.get(`input[placeholder="${PLACEHOLDER_CARI}"]`).type("senilai");
        cy.contains("article h3", BAB_SELESAI.name).should("be.visible");
        cy.get("section article h3").should("have.length", 1);
    });

    it("CY-HASIL-008 pencarian tidak membedakan huruf besar/kecil", () => {
        cy.get(`input[placeholder="${PLACEHOLDER_CARI}"]`).type("BILANGAN bulat");
        cy.contains("article h3", BAB_PROSES_A.name).should("be.visible");
    });

    it("CY-HASIL-009 pencarian tanpa hasil menampilkan pesan yang sesuai", () => {
        cy.get(`input[placeholder="${PLACEHOLDER_CARI}"]`).type("qwzxkosongtidakada123");
        cy.contains(PESAN_KOSONG).should("be.visible");
        cy.get("section article h3").should("not.exist");
    });
});

describe("Hasil Pembelajaran: filter status pembelajaran (data tiruan, F05.2, F05.3)", () => {
    beforeEach(bukaHalamanDenganDataTiruan);

    it("CY-HASIL-010 filter menyediakan 3 pilihan: Semua, Selesai, Sedang Dipelajari (F05.3)", () => {
        cy.contains("button", "Filters").click();
        cy.contains("Filter Berdasarkan Progres").should("be.visible");
        ["Semua", "Selesai", "Sedang Dipelajari"].forEach((opsi) => {
            cy.contains('[class*="absolute"] button', opsi).should("be.visible");
        });
    });

    it("CY-HASIL-011 filter \"Selesai\" hanya menampilkan BAB berstatus selesai (F05.2)", () => {
        pilihFilter("Selesai");
        cy.contains("button", /^Filters: Selesai$/).should("be.visible");
        cy.contains("article h3", BAB_SELESAI.name).should("be.visible");
        cy.get("section article h3").should("have.length", 1);
    });

    it("CY-HASIL-012 filter \"Sedang Dipelajari\" hanya menampilkan BAB yang sedang dipelajari (F05.2)", () => {
        pilihFilter("Sedang Dipelajari");
        cy.contains("button", /^Filters: Sedang Dipelajari$/).should("be.visible");
        cy.contains("article h3", BAB_PROSES_A.name).should("be.visible");
        cy.contains("article h3", BAB_PROSES_B.name).should("be.visible");
        cy.contains("article h3", BAB_SELESAI.name).should("not.exist");
    });

    it("CY-HASIL-013 filter bisa dikembalikan ke \"Semua\" lewat \"Kembalikan ke Default\"", () => {
        pilihFilter("Selesai");
        cy.contains("button", "Filters").click();
        cy.contains("Kembalikan ke Default").click();
        cy.contains("button", "Filters").should("be.visible").and("not.contain.text", "Filters:");
        cy.get("section article h3").should("have.length", 3);
    });

    it("CY-HASIL-014 filter dan pencarian bekerja bersamaan", () => {
        pilihFilter("Sedang Dipelajari");
        cy.get(`input[placeholder="${PLACEHOLDER_CARI}"]`).type("Pecahan");
        cy.contains("article h3", BAB_PROSES_B.name).should("be.visible"); // sedang dipelajari + cocok "Pecahan"
        cy.contains("article h3", BAB_SELESAI.name).should("not.exist"); // cocok "Pecahan" tapi sudah selesai
        cy.get("section article h3").should("have.length", 1);
    });
});

describe("Hasil Pembelajaran: kondisi memuat dan gagal (data tiruan)", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
    });

    it("CY-HASIL-015 saat memuat tampil teks \"Memuat hasil pembelajaran...\" lalu diganti kartu BAB", () => {
        stubHasilPembelajaran({ delay: 1500 });
        cy.visit("/hasil-pembelajaran");
        cy.contains("Memuat hasil pembelajaran...").should("be.visible");
        cy.wait("@hasil");
        cy.contains("Memuat hasil pembelajaran...").should("not.exist");
        cy.contains("article h3", BAB_SELESAI.name).should("be.visible");
    });

    it("CY-HASIL-016 gagal memuat data menampilkan pesan error dan ringkasan 0", () => {
        cy.intercept("GET", "**/api/learning-results", {
            statusCode: 500,
            body: { statusCode: 500, success: false, message: "Hasil pembelajaran gagal dimuat." },
        }).as("hasil");
        cy.visit("/hasil-pembelajaran");
        cy.wait("@hasil");
        cy.contains("Hasil pembelajaran gagal dimuat.").should("be.visible");
        cy.get("section article h3").should("not.exist");
        cy.contains("article", "BAB Selesai Dipelajari").should("contain.text", "0");
    });
});
