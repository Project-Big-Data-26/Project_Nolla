// Tes token kedaluwarsa — NOLLA (CY-LOGIN-034, 035, 036)
// Lokasi: frontend/cypress/e2e/auth/login-token.cy.js
//
// Cara pakai: cukup jalankan seperti biasa, tidak ada flag yang perlu diubah.
//   npx cypress run --spec "cypress/e2e/auth/login*.cy.js"
// Sebelum tes, skrip mengecek umur access token dari backend.
// - Umur <= 120 detik (mis. ACCESS_TOKEN_EXPIRES_IN=1m) -> 3 tes ini dijalankan (sekitar 3,5 menit).
// - Umur lebih panjang (setelan normal) -> 3 tes ini di-SKIP dan alasannya ditulis di log.
// Untuk menjalankannya: .env BACKEND (bukan frontend) ACCESS_TOKEN_EXPIRES_IN=1m dan REFRESH_TOKEN_EXPIRES_IN=2m,
// lalu matikan backend (Ctrl+C) dan jalankan ulang.

const AKUN01 = {
    email: Cypress.env("AKUN01_EMAIL"),
    password: Cypress.env("AKUN01_PASSWORD"),
};
const API_URL = Cypress.env("API_URL") || "http://localhost:5000";
const HALAMAN_BAB = "/topik";

function decodeJwt(token) {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
}

function loginViaUi() {
    cy.visit("/login");
    cy.contains("h1", "Masuk ke Akun Anda").should("be.visible");
    cy.get('input[name="email"]').clear().type(AKUN01.email);
    cy.get('input[name="password"]').clear().type(AKUN01.password, { log: false });
    cy.contains('button[type="submit"]', /^Masuk$/).click();
    cy.wait("@login").its("response.statusCode").should("be.within", 200, 299);
    cy.location("pathname").should("eq", HALAMAN_BAB);
}

function expectNoTokens() {
    cy.window().should((win) => {
        expect(win.localStorage.getItem("accessToken")).to.be.null;
        expect(win.localStorage.getItem("refreshToken")).to.be.null;
    });
}

// Pastikan access token memang berumur pendek.
function expectAccessTokenPendek() {
    cy.window().then((win) => {
        const p = decodeJwt(win.localStorage.getItem("accessToken"));
        if (!p) throw new Error("accessToken bukan JWT, umurnya tidak bisa dicek.");
        expect(p.exp - p.iat, "umur access token (detik)").to.be.at.most(120);
    });
}

describe("Login — token kedaluwarsa", () => {
    before(function () {
        // Cek umur access token langsung ke backend; skip seluruh blok kalau tidak pendek.
        cy.request({
            method: "POST",
            url: `${API_URL}/api/auth/login`,
            body: { email: AKUN01.email, password: AKUN01.password },
            failOnStatusCode: false,
        }).then((res) => {
            const token = res.body && (res.body.accessToken || (res.body.data && res.body.data.accessToken));
            const p = token ? decodeJwt(token) : null;
            const umur = p ? p.exp - p.iat : null;
            if (umur === null || umur > 120) {
                cy.log(
                    `SKIP: umur access token = ${umur === null ? "tidak terbaca" : umur + " detik"}. ` +
                    "Set ACCESS_TOKEN_EXPIRES_IN=1m dan REFRESH_TOKEN_EXPIRES_IN=2m di .env backend, restart backend.",
                );
                this.skip();
            }
        });
    });

    beforeEach(() => {
        cy.intercept("POST", "**/api/auth/login").as("login");
        cy.intercept("GET", "**/api/dashboard/bab*").as("bab");
    });

    // Penting: alias lama menampung request saat login, jadi sebelum reload kita daftarkan alias BARU
    // ("apiReload") yang menangkap SEMUA request API sesudah reload (bukan hanya BAB), karena yang
    // memicu refresh bisa request API mana saja, dan halaman Login bahkan tidak memanggil BAB.
    function reloadDenganAliasBaru() {
        cy.intercept("**/api/**").as("apiReload");
        cy.reload();
    }

    // Bukti token kedaluwarsa: minimal satu request API setelah reload dijawab 401 (dicoba ulang sampai muncul).
    function expectAdaRequest401() {
        cy.get("@apiReload.all").should((calls) => {
            const ringkas = calls.map(
                (c) => `${c.request.method} ${c.request.url.replace(/^https?:\/\/[^/]+/, "")} -> ${c.response ? c.response.statusCode : "?"}`,
            );
            expect(ringkas.join(" | "), "request API setelah reload").to.match(/-> 401/);
        });
        cy.get("@apiReload.all").then((calls) => {
            cy.log(
                calls
                    .map((c) => `${c.request.method} ${c.request.url} -> ${c.response ? c.response.statusCode : "?"}`)
                    .join("\n"),
            );
        });
    }

    it("CY-LOGIN-034: access token kedaluwarsa diperbarui otomatis", () => {
        loginViaUi();
        expectAccessTokenPendek();
        cy.window().then((win) => {
            cy.wrap(win.localStorage.getItem("accessToken")).as("tokenAwal");
        });
        cy.wait(65000);
        reloadDenganAliasBaru();
        // Hasil akhir: tetap login di halaman BAB dan accessToken berganti.
        cy.location("pathname").should("eq", HALAMAN_BAB);
        cy.get("@tokenAwal").then((tokenAwal) => {
            cy.window().its("localStorage").invoke("getItem", "accessToken")
                .should("be.a", "string")
                .and("not.eq", tokenAwal);
        });
        expectAdaRequest401();
    });

    it("CY-LOGIN-035: refresh token rusak membuat siswa diarahkan ke Login", () => {
        loginViaUi();
        expectAccessTokenPendek();
        cy.window().then((win) => win.localStorage.setItem("refreshToken", "token-rusak-acak"));
        cy.wait(65000);
        reloadDenganAliasBaru();
        cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
        expectNoTokens();
        expectAdaRequest401();
    });

    // Refresh token NOLLA bukan JWT, jadi dicek lewat perilaku (butuh REFRESH=2m):
    // login t=0, refresh otomatis t~66s (masih login), lalu t~130s refresh token habis -> harus ke Login.
    // Kalau sesi diperpanjang saat refresh, siswa masih login di t~130s -> tes Fail (bug).
    it("CY-LOGIN-036: batas sesi tidak bertambah saat token diperbarui", () => {
        loginViaUi();
        expectAccessTokenPendek();
        cy.wait(65000);
        reloadDenganAliasBaru();
        cy.location("pathname").should("eq", HALAMAN_BAB); // refresh pertama berhasil
        cy.wait(65000); // total > 130 detik sejak login
        reloadDenganAliasBaru();
        cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
        expectNoTokens();
    });
});
