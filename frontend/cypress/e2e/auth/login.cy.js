// Test suite Login — NOLLA (sesuai TC-Login_NOLLA_revisi.xlsx, revisi 4)
// Lokasi: frontend/cypress/e2e/auth/login.cy.js
//
// Berbeda dengan registration-negative.cy.js, suite ini memakai BACKEND ASLI (tanpa mock),
// karena fitur login sudah terintegrasi. Request login hanya di-spy, tidak dipalsukan.
//
// Prasyarat:
// - Frontend dan backend berjalan (backend di localhost:5000), dengan setelan .env normal.
// - AKUN-01 (daftar lewat form email) dan AKUN-07 (akun Google tanpa kata sandi) sudah ada.
// - Kredensial diisi di frontend/cypress.env.json (JANGAN di-commit, tambahkan ke .gitignore):
//   {
//     "AKUN01_EMAIL": "...", "AKUN01_PASSWORD": "...",
//     "AKUN07_EMAIL": "..."
//   }
//
// Tidak ada di file ini (dikerjakan di tempat lain):
// - Manual (lihat spreadsheet): CY-LOGIN-017, 018, 019, 023–028, 030, 033, 037.
//   017, 018, 037 dicek lewat MongoDB karena refresh token bukan JWT.
// - Tes token kedaluwarsa (CY-LOGIN-034–036): login-token.cy.js.
//
// Selector yang BELUM pasti (cek saat pertama kali dijalankan, sesuaikan kalau gagal):
// - checkbox "Ingat saya"            -> SEL.rememberMe
// - tombol tampilkan/sembunyikan     -> SEL.passwordToggle
// - cara aplikasi menampilkan pesan  -> expectMessage() menerima window.alert ATAU teks di halaman

const AKUN01 = {
    email: Cypress.env("AKUN01_EMAIL"),
    password: Cypress.env("AKUN01_PASSWORD"),
};
const AKUN07_EMAIL = Cypress.env("AKUN07_EMAIL");
const EMAIL_TIDAK_TERDAFTAR = "tidakterdaftar.nolla@example.com";
const PESAN_GENERIK = "Email atau kata sandi salah.";
const HALAMAN_BAB = "/topik";

const SEL = {
    email: 'input[name="email"]',
    password: 'input[name="password"]',
    submit: 'button[type="submit"]',
    rememberMe: 'input[type="checkbox"]',
    passwordToggle: () => cy.get('input[name="password"]').parent().find("button"),
};

let alertStub;

function visitLogin() {
    cy.visit("/login", {
        onBeforeLoad(win) {
            alertStub = cy.stub(win, "alert").as("alert");
        },
    });
    cy.contains("h1", "Masuk ke Akun Anda").should("be.visible");
}

function fillLogin(email, password) {
    if (email) cy.get(SEL.email).clear().type(email);
    if (password) cy.get(SEL.password).clear().type(password, { log: false });
}

function submitLogin() {
    cy.contains(SEL.submit, /^Masuk$/).click();
}

function loginViaUi({ remember = false } = {}) {
    visitLogin();
    fillLogin(AKUN01.email, AKUN01.password);
    if (remember) cy.get(SEL.rememberMe).check();
    submitLogin();
    cy.wait("@login").its("response.statusCode").should("be.within", 200, 299);
    cy.location("pathname").should("eq", HALAMAN_BAB);
}

// Lolos kalau pesan muncul lewat window.alert ATAU sebagai teks di halaman.
function expectMessage(text) {
    cy.document().should((doc) => {
        const viaAlert = alertStub
            .getCalls()
            .some((call) => String(call.args[0]).includes(text));
        const viaPage = doc.body.innerText.includes(text);
        expect(viaAlert || viaPage, `pesan "${text}" tampil`).to.eq(true);
    });
}

function expectNoTokens() {
    cy.window().should((win) => {
        expect(win.localStorage.getItem("accessToken")).to.be.null;
        expect(win.localStorage.getItem("refreshToken")).to.be.null;
    });
}

function expectTokensSaved() {
    cy.window().should((win) => {
        expect(win.localStorage.getItem("accessToken")).to.be.a("string");
        expect(win.localStorage.getItem("refreshToken")).to.be.a("string");
    });
}

function expectBlockedBeforeApi(selector, validityFlag) {
    submitLogin();
    cy.get(selector).should(($input) => {
        expect($input[0].validity[validityFlag]).to.eq(true);
    });
    cy.location("pathname").should("eq", "/login");
    cy.get("@login.all").should("have.length", 0);
}

describe("Login — halaman & tampilan", () => {
    beforeEach(() => {
        cy.intercept("POST", "**/api/auth/login").as("login");
        visitLogin();
    });

    it("CY-LOGIN-002 (pelengkap auth-smoke): checkbox \"Ingat saya\" tampil dan bisa dicentang", () => {
        cy.contains(/Ingat saya/i).should("be.visible");
        cy.get(SEL.rememberMe).should("not.be.checked").check().should("be.checked");
    });

    it("CY-LOGIN-005: kata sandi tersembunyi secara default", () => {
        cy.get(SEL.password).type("Coba1234", { log: false });
        cy.get(SEL.password).should("have.attr", "type", "password");
    });

    it("CY-LOGIN-006 & 007: kata sandi bisa ditampilkan lalu disembunyikan lagi", () => {
        cy.get(SEL.password).type("Coba1234", { log: false });
        SEL.passwordToggle().click();
        cy.get(SEL.password).should("have.attr", "type", "text");
        SEL.passwordToggle().click();
        cy.get(SEL.password).should("have.attr", "type", "password");
    });

    it("CY-LOGIN-021: tautan \"Buat akun baru\" membuka halaman Registrasi", () => {
        cy.contains("a", "Buat akun baru").click();
        cy.location("pathname").should("eq", "/register");
    });

    it("CY-LOGIN-022: tautan \"Lupa Kata Sandi?\" membuka halaman Lupa Kata Sandi", () => {
        cy.contains("a", "Lupa Kata Sandi?").click();
        cy.location("pathname").should("eq", "/forgot-password");
    });
});

describe("Login — validasi input (tidak boleh terkirim ke API)", () => {
    beforeEach(() => {
        cy.intercept("POST", "**/api/auth/login").as("login");
        visitLogin();
    });

    afterEach(() => expectNoTokens());

    it("CY-LOGIN-011: email kosong menahan submit", () => {
        fillLogin(null, "Coba1234");
        expectBlockedBeforeApi(SEL.email, "valueMissing");
    });

    it("CY-LOGIN-012: kata sandi kosong menahan submit", () => {
        fillLogin(AKUN01.email, null);
        expectBlockedBeforeApi(SEL.password, "valueMissing");
    });

    it("CY-LOGIN-013: semua field kosong menahan submit", () => {
        expectBlockedBeforeApi(SEL.email, "valueMissing");
    });

    it("CY-LOGIN-014: format email tidak valid menahan submit", () => {
        fillLogin("sevira@", "Coba1234");
        expectBlockedBeforeApi(SEL.email, "typeMismatch");
    });
});

describe("Login — dengan backend asli", () => {
    beforeEach(() => {
        cy.intercept("POST", "**/api/auth/login").as("login");
    });

    it("CY-LOGIN-008: login email valid diarahkan ke halaman BAB", () => {
        loginViaUi();
        expectTokensSaved();
    });

    it("CY-LOGIN-009: kata sandi salah ditolak dengan pesan generik", () => {
        visitLogin();
        fillLogin(AKUN01.email, "SalahPass123");
        submitLogin();
        cy.wait("@login").its("response.statusCode").should("be.within", 400, 499);
        expectMessage(PESAN_GENERIK);
        cy.location("pathname").should("eq", "/login");
        expectNoTokens();
    });

    it("CY-LOGIN-010: email tidak terdaftar ditolak dengan pesan yang sama", () => {
        visitLogin();
        fillLogin(EMAIL_TIDAK_TERDAFTAR, "Coba1234");
        submitLogin();
        cy.wait("@login").its("response.statusCode").should("be.within", 400, 499);
        expectMessage(PESAN_GENERIK);
        cy.location("pathname").should("eq", "/login");
        expectNoTokens();
    });

    it("CY-LOGIN-016: login gagal lalu berhasil dengan kata sandi benar", () => {
        visitLogin();
        fillLogin(AKUN01.email, "SalahPass123");
        submitLogin();
        cy.wait("@login");
        expectMessage(PESAN_GENERIK);
        fillLogin(null, AKUN01.password);
        submitLogin();
        cy.wait("@login").its("response.statusCode").should("be.within", 200, 299);
        cy.location("pathname").should("eq", HALAMAN_BAB);
    });

    it("CY-LOGIN-020: tetap login saat pindah halaman dan refresh", () => {
        loginViaUi();
        ["Hasil Belajar", "Profil", "Topik"].forEach((menu) => {
            cy.contains("a, button", menu).click();
            cy.location("pathname").should("not.eq", "/login");
            cy.reload();
            cy.location("pathname").should("not.eq", "/login");
            expectTokensSaved();
        });
    });

    it("CY-LOGIN-029: akun Google tanpa kata sandi tidak bisa login lewat form email", () => {
        visitLogin();
        fillLogin(AKUN07_EMAIL, "Coba1234");
        submitLogin();
        cy.wait("@login").its("response.statusCode").should("be.within", 400, 499);
        expectMessage(PESAN_GENERIK);
        cy.location("pathname").should("eq", "/login");
        expectNoTokens();
    });

    it("CY-LOGIN-031: halaman BAB tidak bisa dibuka tanpa login", () => {
        cy.visit(HALAMAN_BAB);
        cy.location("pathname").should("eq", "/login");
    });

    it("CY-LOGIN-032: siswa yang sudah login membuka /login diarahkan ke halaman BAB", () => {
        loginViaUi();
        cy.visit("/login");
        cy.location("pathname").should("eq", HALAMAN_BAB);
    });
});