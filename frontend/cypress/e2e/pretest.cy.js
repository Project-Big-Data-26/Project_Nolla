// Sprint 1: alur pretest pada halaman Topik (frontend).
// Implementasi saat ini memakai data lokal dan langsung menghasilkan skor simulasi.
// Tes ini tidak membuktikan pengerjaan soal, penilaian backend, atau persistensi hasil.
// Tidak perlu registrasi, OTP, atau backend. Setiap testcase dimulai dari keadaan baru.
const chapter = "#chapter-card-aljabar";

function openConfirmation() {
  // Tombol pertama adalah pretest BAB; tombol berikutnya milik masing-masing subbab.
  cy.get(chapter).contains("button", /^Ambil Pretest$/).click();
  cy.contains("h3", "Mulai Diagnostic Pretest").should("be.visible");
}

function expectPending() {
  cy.get(chapter).within(() => {
    cy.contains("Pretest Belum Diambil").should("be.visible");
    cy.contains("button", /^Ambil Pretest$/).should("be.enabled");
    cy.contains("Selesai (Skor:").should("not.exist");
  });
}

describe("Pretest SMP - simulasi frontend", { testIsolation: true }, () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.visit("/topik", {
      onBeforeLoad(win) {
        // Tetapkan data awal jenjang; tes ini tidak menguji sinkronisasi wizard.
        win.localStorage.setItem("user_education_level", "SMP");
      },
    });
    cy.contains("h1", "Topic Library").should("be.visible");
    // Aljabar belum menjalani pretest dan prasyarat Bilangan sudah terpenuhi.
    cy.get(chapter).contains("button", "Lihat Subbab").click();
    cy.get(chapter).contains("button", "Tutup Subbab")
      .should("have.attr", "aria-expanded", "true");
  });

  it("PRE-01: BAB yang belum pretest menyediakan tombol Ambil Pretest", () => {
    expectPending();
    cy.get(chapter).within(() => {
      cy.contains("h4", "Diagnostic Pretest: Aljabar").should("be.visible");
      cy.contains("Selesaikan pretest untuk membuka subbab").should("be.visible");
    });
  });

  it("PRE-02: tombol pretest membuka dialog konfirmasi untuk BAB yang benar", () => {
    openConfirmation();
    cy.contains("p", "BAB: Aljabar").should("be.visible");
    cy.contains("button", /^Mulai Pretest Sekarang$/).should("be.visible").and("be.enabled");
    cy.contains("button", /^Batal$/).should("be.visible").and("be.enabled");
    cy.contains("h3", "Hasil Diagnostic Pretest").should("not.exist");
  });

  it("PRE-03: membatalkan konfirmasi tidak menyelesaikan pretest", () => {
    openConfirmation();
    cy.contains("button", /^Batal$/).click();
    cy.contains("h3", "Mulai Diagnostic Pretest").should("not.exist");
    cy.contains("h3", "Hasil Diagnostic Pretest").should("not.exist");
    expectPending();
    // Konfirmasi dapat dibuka lagi setelah dibatalkan.
    openConfirmation();
  });

  it("PRE-04: konfirmasi menampilkan hasil simulasi dan memperbarui status BAB", () => {
    openConfirmation();
    cy.contains("button", /^Mulai Pretest Sekarang$/).click();
    cy.contains("h3", "Mulai Diagnostic Pretest").should("not.exist");
    cy.contains("h3", "Hasil Diagnostic Pretest").should("be.visible");
    cy.contains("p", "BAB: Aljabar").should("be.visible");
    cy.contains("p", /^Skor Pretest$/).parent().contains("p", /^85$/).should("be.visible");
    cy.contains("Rekomendasi Pembelajaran").should("be.visible");
    cy.contains("button", /^Tutup Ringkasan$/).click();
    cy.contains("h3", "Hasil Diagnostic Pretest").should("not.exist");
    cy.get(chapter).within(() => {
      cy.contains("Selesai (Skor: 85)").should("be.visible");
      cy.contains("Pretest Belum Diambil").should("not.exist");
      cy.contains("Selesaikan pretest untuk membuka subbab").should("not.exist");
      cy.contains("button", /^Ambil Pretest$/).should("not.exist");
      cy.contains("button", /^Lihat Hasil$/).click();
    });
    cy.contains("h3", "Hasil Diagnostic Pretest").should("be.visible");
    cy.contains("p", /^Skor Pretest$/).parent().contains("p", /^85$/).should("be.visible");
  });

  it("PRE-05: subbab sebelum pretest menampilkan pemberitahuan wajib pretest", () => {
    // Naik dari judul ke kartu subbab, agar tidak memilih tombol pretest BAB.
    cy.get(chapter).contains("h4", /^Bentuk Aljabar$/)
      .parent().parent().parent()
      .contains("button", /^Ambil Pretest$/).click();
    cy.contains("h3", "Pretest Wajib Diselesaikan").should("be.visible");
    cy.contains("p", "BAB: Aljabar").should("be.visible");
    cy.contains("button", /^Ambil Pretest Sekarang$/).should("be.visible");
    cy.contains("button", /^Nanti Saja$/).click();
    cy.contains("h3", "Pretest Wajib Diselesaikan").should("not.exist");
    cy.contains("h3", "Hasil Diagnostic Pretest").should("not.exist");
    expectPending();
  });
});
