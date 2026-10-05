// Smoke test seluruh route utama NOLLA (lintas halaman, bukan bagian UC mana pun).
// Lokasi: frontend/cypress/e2e/smoke/app-smoke.cy.js
//
// Tujuan: pengecekan cepat setelah ada perubahan route/struktur, mis. Landing pindah dari "/" ke "/nolla".
// Yang dicek hanya: halaman terbuka, bukan 404, tidak kosong, dan pengalihan sesuai status login.
// Perilaku detail tiap halaman dites di spec masing-masing (login, registrasi, profil, dll).
//
// Prasyarat: frontend jalan; backend jalan + AKUN-01 di cypress.env.json (untuk blok "sudah login").

const AKUN01 = {
    email: Cypress.env("AKUN01_EMAIL"),
    password: Cypress.env("AKUN01_PASSWORD"),
};
const TEKS_404 = "404 | Halaman Tidak Ditemukan";

function expectHalamanTampil() {
    cy.get("body").should("not.contain.text", TEKS_404);
    cy.get("#root").invoke("text").should("not.be.empty");
}

function loginViaUi() {
    cy.intercept("POST", "**/api/auth/login").as("login");
    cy.visit("/login");
    cy.get('input[name="email"]').clear().type(AKUN01.email);
    cy.get('input[name="password"]').clear().type(AKUN01.password, { log: false });
    cy.contains('button[type="submit"]', /^Masuk$/).click();
    cy.wait("@login").its("response.statusCode").should("be.within", 200, 299);
    cy.location("pathname").should("eq", "/topik");
}

describe("Smoke — halaman publik (pengunjung belum login)", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
    });

    ["/nolla", "/login", "/register", "/forgot-password"].forEach((path) => {
        it(`SMOKE ${path} terbuka dan tidak 404`, () => {
            cy.visit(path);
            cy.location("pathname").should("eq", path);
            expectHalamanTampil();
        });
    });

    // Butuh state dari halaman sebelumnya (email/OTP/token), jadi dibuka langsung hanya dicek tidak 404.
    ["/verify", "/reset"].forEach((path) => {
        it(`SMOKE ${path} dibuka langsung tidak menampilkan 404`, () => {
            cy.visit(path);
            expectHalamanTampil();
        });
    });

    it("SMOKE path tidak dikenal menampilkan halaman 404", () => {
        cy.visit("/halaman-yang-tidak-ada");
        cy.contains(TEKS_404).should("be.visible");
    });

    ["/", "/topik", "/profile", "/profile/edit", "/profile/ganti-password", "/hasil-pembelajaran", "/dashboard"].forEach((path) => {
        it(`SMOKE ${path} tanpa login diarahkan ke /login`, () => {
            cy.visit(path);
            cy.location("pathname").should("eq", "/login");
        });
    });
});

describe("Smoke — halaman siswa (sudah login)", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi();
    });

    ["/", "/topik", "/profile", "/profile/edit", "/profile/ganti-password", "/hasil-pembelajaran"].forEach((path) => {
        it(`SMOKE ${path} terbuka setelah login`, () => {
            cy.visit(path);
            cy.location("pathname").should("not.eq", "/login");
            expectHalamanTampil();
        });
    });

    it("SMOKE /login dan /register saat sudah login diarahkan ke /topik", () => {
        ["/login", "/register"].forEach((path) => {
            cy.visit(path);
            cy.location("pathname").should("eq", "/topik");
        });
    });
});
