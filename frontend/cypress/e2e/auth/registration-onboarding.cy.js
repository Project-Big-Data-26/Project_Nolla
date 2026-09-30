// Jalankan dengan npx cypress open. Backend, database, dan SMTP harus aktif.
// "verify-existing": lanjutkan akun belum terverifikasi dengan OTP yang sudah diterima.
// Mode ini tidak mendaftar ulang atau mengirim OTP baru; bukan bukti E2E registrasi penuh.
// "register": uji registrasi penuh menggunakan email yang belum terdaftar.
// Isi kotak OTP pada aplikasi; tes menunggu maksimal 9 menit dan melanjutkan otomatis.
// OTP backend berlaku 10 menit sejak dibuat, bukan sejak tes ini dijalankan.
const startMode = "register";
const testTitle = startMode === "register"
  ? "E2E-01 POSITIF: registrasi, OTP email, SMP, dan BAB"
  : "RECOVERY-01: lanjut verifikasi akun yang sudah dibuat sampai BAB";
const user = {
  name: "Nopel Test",
  email: "nire06221@gmail.com",
  password: "Sprint1Test123!",
};
const otpInputs = 'input[inputmode="numeric"][maxlength="1"]';

function expectApiSuccess(response, action) {
  expect(response, `${action}: backend harus memberikan respons`).to.exist;
  const message = response.body?.message || "Tidak ada pesan dari backend";
  expect(response.statusCode, `${action}: ${message}`).to.eq(200);
  expect(response.body.status, `${action}: ${message}`).to.eq("success");
}

describe("Registrasi sampai BAB - OTP email asli", { retries: 0, testIsolation: true }, () => {
  it(testTitle, () => {
    // Headless tidak bisa menunggu pengguna membaca inbox dan mengisi OTP.
    expect(
      Cypress.config("isInteractive"),
      "Gunakan npx cypress open agar OTP dari email bisa diisi di aplikasi",
    ).to.eq(true);

    cy.viewport(1280, 800);
    // Spy saja: semua request diteruskan ke backend, tanpa respons atau token mock.
    cy.intercept("POST", "**/api/auth/register").as("register");
    cy.intercept("POST", "**/api/auth/verify-email").as("verifyEmail");
    cy.intercept("POST", "**/api/personalization").as("saveEducation");

    expect(startMode, "Mode awal tes").to.be.oneOf(["register", "verify-existing"]);
    if (startMode === "verify-existing") {
      cy.visit("/verify", {
        onBeforeLoad(win) {
          // React Router membaca location.state dari history.state.usr.
          // Hanya membawa email ke form; verifikasi tetap memakai API dan OTP asli.
          win.history.replaceState({ usr: { email: user.email }, key: "otp-recovery", idx: 0 }, "");
          cy.stub(win, "alert").as("alert");
        },
      });
    } else {
      cy.visit("/login", {
        onBeforeLoad(win) {
          cy.stub(win, "alert").as("alert");
        },
      });
      cy.contains("a", "Buat akun baru").click();
      cy.location("pathname").should("eq", "/register");
      cy.contains("h1", "Buat Akun Baru").should("be.visible");
      cy.get('input[name="fullName"]').type(user.name);
      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type(user.password, { log: false });
      cy.get('input[name="confirmPassword"]').type(user.password, { log: false });
      cy.get('input[name="agreeTerms"]').check().should("be.checked");
      cy.contains('button[type="submit"]', /^Daftar Akun$/).click();

      cy.wait("@register", { responseTimeout: 60000 }).then(({ request, response }) => {
        expect(request.body).to.deep.equal(user);
        if (response?.body?.message === "Email sudah terdaftar") {
          throw new Error(
            `${user.email} sudah terdaftar. Backend tidak mengirim ulang OTP melalui registrasi. ` +
            "Prasyarat E2E-01: email harus belum terdaftar. Minta tim backend menyiapkan ulang akun uji. Untuk menguji penolakan email duplikat, jalankan REG-02 di registration-negative.cy.js.",
          );
        }
        expectApiSuccess(response, "Registrasi dan pengiriman OTP");
      });
      cy.get("@alert").should(
        "have.been.calledWithExactly",
        "Pendaftaran Berhasil! Silakan cek email Anda untuk kode verifikasi OTP.",
      );
    }
    cy.location("pathname").should("eq", "/verify");
    cy.contains("h1", "Verifikasi Email").should("be.visible");
    cy.contains("p", "Kode OTP telah dikirimkan ke").should("contain.text", user.email);
    cy.get(otpInputs).should("have.length", 6);

    // Tidak memakai pause/Resume: tunggu pengguna mengisi keenam kotak di aplikasi.
    // Jangan klik Run ulang atau tombol Verifikasi sendiri.
    cy.log(`Isi OTP yang masih berlaku dari inbox/spam ${user.email}. Tes melanjutkan otomatis.`);
    cy.get(otpInputs, { timeout: 9 * 60 * 1000 }).should(($inputs) => {
      expect($inputs).to.have.length(6);
      expect(
        [...$inputs].every((input) => /^\d$/.test(input.value)),
        "Menunggu 6 digit OTP diisi manual pada aplikasi",
      ).to.eq(true);
    });
    cy.contains('button[type="submit"]', /^Verifikasi Email$/).click();
    cy.wait("@verifyEmail", { responseTimeout: 60000 }).then(({ request, response }) => {
      expect(request.body.email).to.eq(user.email);
      expect(/^\d{6}$/.test(request.body.otp), "OTP yang dikirim terdiri dari enam digit").to.eq(true);
      expectApiSuccess(response, "Verifikasi OTP");
      expect(response.body.data.user.isProfileComplete).to.eq(false);
      cy.window({ log: false }).should((win) => {
        // Hindari mencetak nilai token sungguhan ke assertion log.
        for (const key of ["accessToken", "refreshToken"]) {
          const token = response.body.data[key];
          expect(typeof token === "string" && token.length > 0, `${key} diterima dari backend`).to.eq(true);
          expect(win.localStorage.getItem(key) === token, `${key} tersimpan`).to.eq(true);
        }
      });
    });
    cy.get("@alert").should("have.been.calledWithExactly", "Verifikasi berhasil! Akun Anda sudah aktif.");
    cy.location("pathname").should("eq", "/personalization");

    cy.contains("h1", "Hai, kenalan dulu yuk!").should("be.visible");
    cy.contains("button", "Simpan & Masuk ke Dashboard").should("be.disabled");
    cy.contains("button span", /^SMP$/).closest("button").click();
    cy.contains("button", "Simpan & Masuk ke Dashboard").should("be.enabled").click();
    cy.wait("@saveEducation", { responseTimeout: 60000 }).then(({ request, response }) => {
      expect(request.body).to.deep.equal({ educationLevel: "smp" });
      expectApiSuccess(response, "Simpan jenjang SMP");
      cy.window({ log: false }).should((win) => {
        expect(
          request.headers.authorization === `Bearer ${win.localStorage.getItem("accessToken")}`,
          "Personalisasi menggunakan token hasil verifikasi",
        ).to.eq(true);
      });
    });
    cy.get("@alert").should("have.been.calledWithExactly", "Jenjang pendidikan berhasil disimpan!");
    cy.location("pathname").should("eq", "/dashboard");
    cy.contains('nav a[href="/topik"]', "Topik").click();
    cy.location("pathname").should("eq", "/topik");
    cy.contains("h1", "Topic Library").should("be.visible");
    cy.get('button[title="Klik untuk memilih jenjang SD, SMP, atau SMA"]')
      .should("be.visible")
      .and("contain.text", "SMP");
    // Skenario ini hanya mencakup SMP, bukan perbaikan bug sinkronisasi SD/SMA.
    cy.get("#chapter-card-bilangan").within(() => {
      cy.contains("h2", /^Bilangan$/).should("be.visible");
      cy.contains("button", "Tutup Subbab").should("have.attr", "aria-expanded", "true").click();
      cy.contains("button", "Lihat Subbab").should("have.attr", "aria-expanded", "false").click();
      cy.contains("button", "Tutup Subbab").should("have.attr", "aria-expanded", "true");
      cy.contains("Bilangan Bulat").should("be.visible");
    });
  });
});
