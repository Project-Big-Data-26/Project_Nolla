// Test suite Logout — NOLLA
// Sumber: TC-Logout_NOLLA_3okt.xlsx
// Otomatis: CY-LOGOUT-001 s.d. CY-LOGOUT-022
// Manual: CY-LOGOUT-023 (Login Google)
//
// Prasyarat:
// - Frontend berjalan di baseUrl Cypress.
// - Backend berjalan di localhost:5000.
// - AKUN-01 tersedia di cypress.env.json melalui:
//   AKUN01_EMAIL
//   AKUN01_PASSWORD
//
// Catatan:
// - CY-LOGOUT-023 dijalankan manual karena melibatkan login Google.
// - Endpoint Logout diasumsikan POST /api/auth/logout.
// - Token frontend diasumsikan disimpan di localStorage:
//   accessToken, refreshToken, user.

const AKUN01 = {
  email: Cypress.env("AKUN01_EMAIL"),
  password: Cypress.env("AKUN01_PASSWORD"),
};

const ROUTES = {
  login: "/login",
  topik: "/topik",
  hasil: "/hasil-pembelajaran",
  profile: "/profile",
};

const SEL = {
  email: 'input[name="email"]',
  password: 'input[name="password"]',
  loginSubmit: 'button[type="submit"]',
  sidebarLogout: 'button[title="Keluar"]',
  profileLogout: "#btn-profile-logout",
  dialog: '[role="alertdialog"]',
};

/* =========================================================
 * Helper
 * ========================================================= */

function requireCredentials() {
  expect(AKUN01.email, "Cypress.env AKUN01_EMAIL").to.match(/\S/);
  expect(AKUN01.password, "Cypress.env AKUN01_PASSWORD").to.match(/\S/);
}

function expectSessionPresent() {
  cy.window().should((win) => {
    expect(
      win.localStorage.getItem("accessToken"),
      "accessToken"
    ).to.match(/\S/);

    expect(
      win.localStorage.getItem("refreshToken"),
      "refreshToken"
    ).to.match(/\S/);
  });
}

function expectSessionCleared() {
  cy.window().should((win) => {
    expect(
      win.localStorage.getItem("accessToken"),
      "accessToken"
    ).to.eq(null);

    expect(
      win.localStorage.getItem("refreshToken"),
      "refreshToken"
    ).to.eq(null);

    expect(
      win.localStorage.getItem("user"),
      "user"
    ).to.eq(null);
  });
}

function loginViaUi() {
  requireCredentials();

  cy.intercept("POST", "**/api/auth/login").as("login");

  cy.visit(ROUTES.login);

  cy.get(SEL.email)
    .should("be.visible")
    .clear()
    .type(AKUN01.email);

  cy.get(SEL.password)
    .should("be.visible")
    .clear()
    .type(AKUN01.password, { log: false });

  cy.contains(SEL.loginSubmit, /^Masuk$/)
    .should("be.visible")
    .and("be.enabled")
    .click();

  cy.wait("@login")
    .its("response.statusCode")
    .should("be.within", 200, 299);

  cy.location("pathname", { timeout: 10000 })
    .should("eq", ROUTES.topik);

  expectSessionPresent();
}

function visitProtected(path) {
  cy.visit(path);

  cy.location("pathname", { timeout: 10000 })
    .should("eq", path);
}

function expectLogoutDialog() {
  cy.get(SEL.dialog)
    .should("exist")
    .and("be.visible")
    .within(() => {
      cy.contains("Konfirmasi Keluar")
        .should("be.visible");

      cy.contains(
        "Apakah kamu yakin ingin keluar dari akun ini?"
      ).should("be.visible");

      cy.contains("button", /^Batal$/)
        .should("be.visible")
        .and("be.enabled");

      cy.contains("button", /^Ya, Keluar$/)
        .should("be.visible")
        .and("be.enabled");
    });
}

function openSidebarLogout(path = ROUTES.topik) {
  visitProtected(path);

  cy.get(SEL.sidebarLogout)
    .should("be.visible")
    .and("be.enabled")
    .click();

  expectLogoutDialog();
}

function openProfileLogout() {
  visitProtected(ROUTES.profile);

  cy.get(SEL.profileLogout)
    .scrollIntoView()
    .should("be.visible")
    .and("be.enabled")
    .click();

  expectLogoutDialog();
}

function cancelLogout() {
  cy.get(SEL.dialog)
    .contains("button", /^Batal$/)
    .should("be.enabled")
    .click();

  cy.get(SEL.dialog)
    .should("not.exist");
}

function confirmLogout() {
  cy.intercept(
    "POST",
    "**/api/auth/logout"
  ).as("logout");

  cy.get(SEL.dialog)
    .contains("button", /^Ya, Keluar$/)
    .should("be.enabled")
    .click();

  cy.wait("@logout")
    .its("response.statusCode")
    .should("be.within", 200, 299);

  cy.location("pathname", {
    timeout: 10000,
  }).should("eq", ROUTES.login);

  expectSessionCleared();
}

/* =========================================================
 * CY-LOGOUT-001 s.d. CY-LOGOUT-007
 * Akses dan dialog
 * ========================================================= */

describe("Logout — akses dan dialog", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    loginViaUi();
  });

  [
    [
      "CY-LOGOUT-001",
      ROUTES.topik,
      "halaman BAB",
    ],
    [
      "CY-LOGOUT-002",
      ROUTES.hasil,
      "halaman Hasil Belajar",
    ],
    [
      "CY-LOGOUT-003",
      ROUTES.profile,
      "halaman Profil",
    ],
  ].forEach(([id, path, label]) => {
    it(`${id}: akses Logout pada sidebar tersedia di ${label}`, () => {
      visitProtected(path);

      cy.get(SEL.sidebarLogout)
        .should("be.visible")
        .and("be.enabled");
    });
  });

  it("CY-LOGOUT-004: menu Keluar tersedia pada bagian Akun di Profil", () => {
    visitProtected(ROUTES.profile);

    cy.contains("Akun")
      .should("be.visible");

    cy.get(SEL.profileLogout)
      .scrollIntoView()
      .should("be.visible")
      .and("be.enabled");
  });

  it("CY-LOGOUT-005: Logout dari sidebar menampilkan dialog konfirmasi", () => {
    openSidebarLogout();
  });

  it("CY-LOGOUT-006: Keluar dari Profil menampilkan dialog konfirmasi yang sama", () => {
    openProfileLogout();
  });

  it("CY-LOGOUT-007: elemen dialog konfirmasi tampil lengkap", () => {
    openSidebarLogout();

    expectLogoutDialog();
  });
});

/* =========================================================
 * CY-LOGOUT-008 s.d. CY-LOGOUT-014
 * Konfirmasi dan pembatalan
 * ========================================================= */

describe("Logout — konfirmasi dan pembatalan", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    loginViaUi();
  });

  it("CY-LOGOUT-008: konfirmasi Logout dari sidebar berhasil", () => {
    openSidebarLogout();

    confirmLogout();

    expectSessionCleared();
  });

  it("CY-LOGOUT-009: konfirmasi Logout dari Profil berhasil", () => {
    openProfileLogout();

    confirmLogout();

    expectSessionCleared();
  });

  it("CY-LOGOUT-010: token dan sesi lokal dibersihkan setelah Logout", () => {
    openSidebarLogout();

    expectSessionPresent();

    confirmLogout();

    expectSessionCleared();
  });

  [
    [
      "CY-LOGOUT-011",
      ROUTES.topik,
      "sidebar",
    ],
    [
      "CY-LOGOUT-012",
      ROUTES.hasil,
      "sidebar",
    ],
    [
      "CY-LOGOUT-013",
      ROUTES.profile,
      "profile",
    ],
  ].forEach(([id, path, entryPoint]) => {
    it(`${id}: membatalkan Logout tetap di ${path} dan mempertahankan sesi`, () => {
      if (entryPoint === "profile") {
        openProfileLogout();
      } else {
        openSidebarLogout(path);
      }

      cancelLogout();

      cy.location("pathname")
        .should("eq", path);

      expectSessionPresent();
    });
  });

  it("CY-LOGOUT-014: pembatalan tidak mengubah token", () => {
    let tokensBefore;

    cy.window().then((win) => {
      tokensBefore = {
        accessToken:
          win.localStorage.getItem("accessToken"),
        refreshToken:
          win.localStorage.getItem("refreshToken"),
      };
    });

    openSidebarLogout();

    cancelLogout();

    cy.window().should((win) => {
      expect(
        win.localStorage.getItem("accessToken"),
        "accessToken setelah Batal"
      ).to.eq(tokensBefore.accessToken);

      expect(
        win.localStorage.getItem("refreshToken"),
        "refreshToken setelah Batal"
      ).to.eq(tokensBefore.refreshToken);
    });
  });
});

/* =========================================================
 * CY-LOGOUT-015 s.d. CY-LOGOUT-020
 * Perlindungan halaman setelah sesi berakhir
 * ========================================================= */

describe("Logout — perlindungan halaman setelah sesi berakhir", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    loginViaUi();
  });

  [
    [
      "CY-LOGOUT-015",
      ROUTES.topik,
    ],
    [
      "CY-LOGOUT-016",
      ROUTES.hasil,
    ],
    [
      "CY-LOGOUT-017",
      ROUTES.profile,
    ],
  ].forEach(([id, previousPath]) => {
    it(`${id}: Back tidak membuka kembali ${previousPath}`, () => {
      openSidebarLogout(previousPath);

      confirmLogout();

      expectSessionCleared();

      cy.go("back");

      cy.location("pathname", {
        timeout: 10000,
      }).should("eq", ROUTES.login);

      expectSessionCleared();
    });
  });

  [
    [
      "CY-LOGOUT-018",
      ROUTES.topik,
    ],
    [
      "CY-LOGOUT-019",
      ROUTES.hasil,
    ],
    [
      "CY-LOGOUT-020",
      ROUTES.profile,
    ],
  ].forEach(([id, protectedPath]) => {
    it(`${id}: akses langsung ${protectedPath} setelah Logout ditolak`, () => {
      openSidebarLogout();

      confirmLogout();

      // Pastikan kondisi test benar-benar sudah Logout.
      expectSessionCleared();

      // Coba akses halaman terproteksi secara langsung.
      cy.visit(protectedPath);

      cy.location("pathname", {
        timeout: 10000,
      }).should("eq", ROUTES.login);

      expectSessionCleared();
    });
  });
});

/* =========================================================
 * CY-LOGOUT-021 s.d. CY-LOGOUT-022
 * Kegagalan dan pemulihan
 * ========================================================= */

describe("Logout — kegagalan dan pemulihan", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    loginViaUi();
  });

  it("CY-LOGOUT-021: kegagalan API Logout mempertahankan keadaan login", () => {
    // Stub harus dibuat sebelum tombol Logout dikonfirmasi.
    cy.intercept(
      "POST",
      "**/api/auth/logout",
      {
        statusCode: 500,
        body: {
          message: "Logout gagal",
        },
      }
    ).as("failedLogout");

    openSidebarLogout();

    cy.get(SEL.dialog)
      .contains("button", /^Ya, Keluar$/)
      .should("be.enabled")
      .click();

    cy.wait("@failedLogout")
      .its("response.statusCode")
      .should("eq", 500);

    // Sesuai UCS:
    // Logout gagal -> siswa tetap login.
    cy.location("pathname", {
      timeout: 10000,
    }).should("eq", ROUTES.topik);

    expectSessionPresent();

    // Pesan error harus terlihat.
    cy.contains(
      /logout gagal|gagal.*keluar|proses.*logout.*gagal/i
    ).should("be.visible");

    // Pastikan halaman masih bisa dipakai.
    cy.get(SEL.sidebarLogout)
      .should("be.visible")
      .and("be.enabled");
  });

  it("CY-LOGOUT-022: pengguna dapat login kembali setelah Logout", () => {
    openSidebarLogout();

    confirmLogout();

    expectSessionCleared();

    cy.intercept(
      "POST",
      "**/api/auth/login"
    ).as("relogin");

    cy.get(SEL.email)
      .should("be.visible")
      .clear()
      .type(AKUN01.email);

    cy.get(SEL.password)
      .should("be.visible")
      .clear()
      .type(
        AKUN01.password,
        { log: false }
      );

    cy.contains(
      SEL.loginSubmit,
      /^Masuk$/
    )
      .should("be.enabled")
      .click();

    cy.wait("@relogin")
      .its("response.statusCode")
      .should("be.within", 200, 299);

    cy.location("pathname", {
      timeout: 10000,
    }).should("eq", ROUTES.topik);

    expectSessionPresent();
  });
});

