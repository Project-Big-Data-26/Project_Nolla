// Testcase negatif frontend: semua request registrasi/OTP memakai mock.
// Tidak membuat akun, mengirim email, atau memerlukan backend/database/SMTP.
// Setiap it() berdiri sendiri. Penolakan yang sesuai ekspektasi berarti tes LULUS.
const user = {
  name: "Nopel Test",
  email: "tiararisa76@gmail.com",
  password: "Sprint1Test123!",
};
const otpInputs = 'input[inputmode="numeric"][maxlength="1"]';
const otpError = "Kode OTP salah atau sudah kedaluwarsa";

function fillRegistration() {
  cy.get('input[name="fullName"]').type(user.name);
  cy.get('input[name="email"]').type(user.email);
  cy.get('input[name="password"]').type(user.password, { log: false });
  cy.get('input[name="confirmPassword"]').type(user.password, { log: false });
  cy.get('input[name="agreeTerms"]').check();
}

function submitRegistration() {
  cy.contains('button[type="submit"]', /^Daftar Akun$/).click();
}

function expectNoTokens() {
  cy.window().should((win) => {
    expect(win.localStorage.getItem("accessToken")).to.be.null;
    expect(win.localStorage.getItem("refreshToken")).to.be.null;
  });
}

function expectFormBlocked(selector, validityFlag) {
  submitRegistration();
  cy.get(selector).should(($input) => {
    expect($input[0].validity[validityFlag]).to.eq(true);
  });
  cy.location("pathname").should("eq", "/register");
  cy.get("@register.all").should("have.length", 0);
  cy.get("@alert").should("not.have.been.called");
}

function openOtp() {
  fillRegistration();
  submitRegistration();
  cy.wait("@register").its("request.body").should("deep.equal", user);
  cy.location("pathname").should("eq", "/verify");
  cy.contains("p", "Kode OTP telah dikirimkan ke").should("contain.text", user.email);
  cy.get(otpInputs).should("have.length", 6);
  // Pisahkan alert sukses registrasi dari alert penolakan OTP yang akan diperiksa.
  cy.get("@alert").then((alert) => alert.resetHistory());
}

function enterOtp(code) {
  [...code].forEach((digit, index) => {
    cy.get(otpInputs).eq(index).type(digit);
  });
}

describe("Registrasi dan OTP - testcase negatif (mock)", { testIsolation: true }, () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.intercept("POST", "**/api/auth/register", {
      statusCode: 200,
      body: { status: "success", message: "Registrasi berhasil" },
    }).as("register");
    cy.intercept("POST", "**/api/auth/verify-email", {
      statusCode: 400,
      body: { status: "error", message: otpError },
    }).as("verifyEmail");
    cy.visit("/register", {
      onBeforeLoad(win) {
        cy.stub(win, "alert").as("alert");
      },
    });
    cy.contains("h1", "Buat Akun Baru").should("be.visible");
  });

  afterEach(() => {
    expectNoTokens();
  });

  it("REG-02: email sudah terdaftar ditolak dan tetap di registrasi", () => {
    cy.intercept("POST", "**/api/auth/register", {
      statusCode: 400,
      body: { status: "error", message: "Email sudah terdaftar" },
    }).as("duplicateRegistration");
    fillRegistration();
    submitRegistration();
    cy.wait("@duplicateRegistration").then(({ request, response }) => {
      expect(request.body).to.deep.equal(user);
      expect(response.statusCode).to.eq(400);
      expect(response.body.message).to.eq("Email sudah terdaftar");
    });
    cy.get("@alert").should("have.been.calledOnceWithExactly", "Email sudah terdaftar");
    cy.location("pathname").should("eq", "/register");
    cy.get('input[name="email"]').should("have.value", user.email);
    cy.get("@verifyEmail.all").should("have.length", 0);
  });

  it("REG-03: konfirmasi password berbeda tidak dikirim ke API", () => {
    fillRegistration();
    cy.get('input[name="confirmPassword"]').clear().type("Berbeda123!", { log: false });
    submitRegistration();
    cy.get("@alert").should(
      "have.been.calledOnceWithExactly",
      "Kata sandi dan konfirmasi kata sandi tidak cocok!",
    );
    cy.location("pathname").should("eq", "/register");
    cy.get("@register.all").should("have.length", 0);
  });

  ["fullName", "email", "password", "confirmPassword"].forEach((field, index) => {
    it(`REG-04-${index + 1}: kolom wajib ${field} kosong menahan submit`, () => {
      fillRegistration();
      const selector = `input[name="${field}"]`;
      cy.get(selector).clear();
      expectFormBlocked(selector, "valueMissing");
    });
  });

  it("REG-05: format email tidak valid menahan submit", () => {
    fillRegistration();
    cy.get('input[name="email"]').clear().type("bukan-email");
    expectFormBlocked('input[name="email"]', "typeMismatch");
  });

  it("REG-06: syarat dan ketentuan belum disetujui menahan submit", () => {
    fillRegistration();
    cy.get('input[name="agreeTerms"]').uncheck();
    expectFormBlocked('input[name="agreeTerms"]', "valueMissing");
  });

  it("OTP-02: OTP kurang dari enam digit tidak dikirim ke API", () => {
    openOtp();
    enterOtp("123");
    cy.contains('button[type="submit"]', /^Verifikasi Email$/).click();
    cy.get("@alert").should(
      "have.been.calledOnceWithExactly",
      "Harap masukkan 6 digit kode OTP secara lengkap!",
    );
    cy.location("pathname").should("eq", "/verify");
    cy.get("@verifyEmail.all").should("have.length", 0);
  });

  [
    { id: "OTP-03", condition: "salah", code: "000000" },
    { id: "OTP-04", condition: "kedaluwarsa", code: "123456" },
  ].forEach(({ id, condition, code }) => {
    it(`${id}: respons penolakan OTP ${condition} ditampilkan`, () => {
      // Kedua kondisi memakai kontrak error backend yang sama.
      // Mock ini menguji respons UI, bukan waktu kedaluwarsa OTP di database.
      openOtp();
      enterOtp(code);
      cy.contains('button[type="submit"]', /^Verifikasi Email$/).click();
      cy.wait("@verifyEmail").then(({ request, response }) => {
        expect(request.body).to.deep.equal({ email: user.email, otp: code });
        expect(response.statusCode).to.eq(400);
      });
      cy.get("@alert").should("have.been.calledOnceWithExactly", otpError);
      cy.location("pathname").should("eq", "/verify");
      cy.contains("h1", "Verifikasi Email").should("be.visible");
    });
  });
});
