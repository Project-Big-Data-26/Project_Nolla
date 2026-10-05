// TC-AUTH-001: Smoke test halaman login (frontend saja).
// Prasyarat: frontend berjalan sesuai baseUrl di cypress.config.js.
// Hasil yang diharapkan: /login menampilkan form siap digunakan.
// Catatan: "/" sekarang menampilkan Landing Page (bukan redirect ke /login lagi),
// jadi halaman Login dibuka langsung lewat path /login.
// Pengujian login Google, pengiriman OTP, dan autentikasi dilakukan terpisah.
describe("Auth smoke test - halaman login", () => {
  it("TC-AUTH-001: menampilkan halaman login dan elemen form utama", () => {
    cy.visit("/login");

    cy.location("pathname").should("eq", "/login");
    cy.contains("h1", "Masuk ke Akun Anda").should("be.visible");

    cy.contains("button", /^Masuk dengan Google$/)
      .should("be.visible")
      .and("be.enabled");

    cy.get('input[name="email"]')
      .should("be.visible")
      .and("be.enabled")
      .and("have.attr", "type", "email");
    cy.get('input[name="password"]')
      .should("be.visible")
      .and("be.enabled")
      .and("have.attr", "type", "password");
    cy.contains('button[type="submit"]', /^Masuk$/)
      .should("be.visible")
      .and("be.enabled");

    cy.contains("a", "Lupa Kata Sandi?")
      .should("be.visible")
      .and("have.attr", "href", "/forgot-password");
    cy.contains("a", "Buat akun baru")
      .should("be.visible")
      .and("have.attr", "href", "/register");

    // Data hanya untuk memastikan form dapat diisi; tidak dikirim ke API.
    cy.get('input[name="email"]')
      .type("tiararisa76@gmail.com")
      .should("have.value", "tiararisa76@gmail.com");
    cy.get('input[name="password"]')
      .type("SmokeTest123!", { log: false })
      .should("have.value", "SmokeTest123!");
  });
});
