/// <reference types="cypress" />
// TC-Profil_NOLLA.xlsx: seluruh test regresi Profil yang sudah Pass. File mandiri, tanpa import.
// (4 Okt 2026: digabung dari profile-pass.cy.js + profile-fail.cy.js setelah semua test di
// profile-fail.cy.js lulus, sesuai alur kerja yang didokumentasikan di file itu.)
// Test case: TC-Profil_NOLLA.xlsx (CY-PROFIL-xxx). Acuan: UCS Mengelola Profil v1.2, SRS v1.3.
// Backend asli. Request tidak di-mock, kecuali CY-PROFIL-005, 017, 031 (exception gagal server).
// Kredensial dari frontend/cypress.env.json:
//   AKUN01_EMAIL, AKUN01_PASSWORD   -> hanya baca (tidak menyimpan perubahan)
//   AKUN08_EMAIL, AKUN08_PASSWORD   -> akun khusus uji Profil (nama, jenjang, avatar, kata sandi diubah lalu dikembalikan)
//   AKUN08_NAMA                     -> nama asli AKUN-08 (default "QA Akun Delapan")
// Tidak ada di sini (dites manual / Postman): CY-PROFIL-003, 032, 034, semua PM-PROFIL.

const EMAIL_01 = Cypress.env("AKUN01_EMAIL");
const PASS_01 = Cypress.env("AKUN01_PASSWORD");
const EMAIL_08 = Cypress.env("AKUN08_EMAIL");
const PASS_08 = Cypress.env("AKUN08_PASSWORD");
const NAMA_08 = Cypress.env("AKUN08_NAMA") || "QA Akun Delapan";
const PASS_BARU = "Nolla1234";
const PASS_BARU_8 = "Nolla123"; // tepat 8 karakter (Test Data CY-PROFIL-020)

const HALAMAN_BAB = "/topik";
const PROFIL = "/profile";
const EDIT = "/profile/edit";
const GANTI_SANDI = "/profile/ganti-password";

// Pesan dicek longgar (teks aplikasi belum dibaca dari kode). Perketat setelah teks aslinya diketahui.
const RE_BERHASIL = /berhasil/i;
const RE_NAMA_KOSONG = /nama.*(kosong|wajib|diisi)|(kosong|wajib|diisi).*nama/i;
const RE_SANDI_LAMA_SALAH = /(lama|saat ini).*(salah|tidak)|salah/i;
const RE_SYARAT_SANDI = /(8 karakter|huruf besar|huruf kecil|angka)/i;
const RE_KONFIRMASI = /(konfirmasi|tidak cocok|tidak sama)/i;
const RE_GAGAL = /(gagal|error|kesalahan|coba lagi)/i;
// Kotak pesan error di form Ganti Kata Sandi (ChangePassword.jsx: div bg-red-50). Dipakai agar pesan dicek di kotak itu,
// bukan di seluruh teks halaman (label "Kata Sandi Saat Ini" dan daftar syarat ikut cocok dengan pola longgar).
const pesanErrorSandi = () => cy.get("form .bg-red-50");
const BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const tanggalHariIni = () => { const d = new Date(); return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`; };
const PESAN_GENERIK = "Email atau kata sandi salah";

// ------------------------------------------------------------------ helper
let alerts = [];

let nomorLogin = 0;
const login = (email, password) => {
    // Alias unik tiap pemanggilan: kalau alias dipakai ulang, cy.wait bisa mengambil request login lama (mis. login sengaja salah di CY-PROFIL-020)
    const alias = `loginApi${++nomorLogin}`;
    cy.intercept("POST", /\/api\/auth\/login/).as(alias);
    cy.visit("/login");
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(password, { log: false });
    cy.contains("button", /^masuk$/i).click();
    // Tunggu respons login dan cek statusnya, supaya kalau gagal terlihat penyebabnya (server lambat atau menolak), bukan hanya "URL masih /login"
    cy.wait(`@${alias}`, { timeout: 15000 }).then(({ response }) => {
        expect(response.statusCode, "status respons login").to.be.within(200, 299);
    });
    cy.location("pathname", { timeout: 10000 }).should("eq", HALAMAN_BAB);
};

const keluar = () => {
    // Logout belum dites di sini; cukup hapus sesi seperti di login.cy.js
    cy.clearAllLocalStorage();
    cy.clearAllCookies();
};

const adaPesan = (re) => {
    cy.get("body").should(($b) => {
        const ada = re.test($b.text()) || alerts.some((a) => re.test(a));
        expect(ada, `pesan ${re}`).to.equal(true);
    });
};

const inputNama = () => cy.contains("label", /nama lengkap/i).parent().find("input");
const inputEmail = () => cy.contains("label", /^email$/i).parent().find("input");
const areaJenjang = () => cy.contains("label", /jenjang belajar/i).parent();
// Mendukung <select> asli maupun dropdown buatan (klik pemicu, lalu klik opsi berdasarkan teks).
const bukaDropdownJenjang = () => {
    areaJenjang().then(($a) => {
        if ($a.find("select").length) return;
        cy.wrap($a).find("button, [role=combobox], [role=button], [aria-haspopup]").first().click();
    });
};
const pilihJenjang = (nilai) => {
    areaJenjang().then(($a) => {
        if ($a.find("select").length) {
            cy.wrap($a.find("select")).select(nilai);
            return;
        }
        bukaDropdownJenjang();
        const re = new RegExp("^\\s*" + nilai + "\\s*$", "i");
        cy.get("body").then(($b) => {
            const cocok = $b.find("[role=option], li, button, div, span, p").filter((_, e) => re.test(e.textContent) && e.children.length === 0);
            expect(cocok.length, `opsi jenjang ${nilai}`).to.be.greaterThan(0);
            cy.wrap(cocok.last()).click();
        });
    });
};
const cekOpsiJenjang = (daftar) => {
    areaJenjang().then(($a) => {
        if ($a.find("select").length) {
            const teks = [...$a.find("select option")].map((o) => o.textContent.trim()).join("|");
            daftar.forEach((j) => expect(teks).to.contain(j));
            return;
        }
        bukaDropdownJenjang();
        daftar.forEach((j) => cy.get("body").contains(new RegExp("^\\s*" + j + "\\s*$", "i")).should("exist"));
    });
};
const tombolSimpan = () => cy.contains("button", /^simpan/i);
const fieldSandiLama = () => cy.get('input[placeholder*="saat ini" i]');
const fieldSandiBaru = () => cy.get('input[placeholder*="baru" i]').filter((_, e) => !/kembali/i.test(e.placeholder));
const fieldKonfirmasi = () => cy.get('input[placeholder*="kembali" i]');

const bukaEdit = () => {
    // Tunggu data profil dari server selesai dimuat sebelum form disentuh (kalau tidak, form bisa di-reset oleh respons yang terlambat)
    cy.intercept("GET", /\/api\/profile/).as("ambilProfil");
    cy.visit(EDIT);
    cy.wait("@ambilProfil");
    inputNama().should("exist");
    inputNama().invoke("val").should("not.be.empty"); // data profil sudah terisi
    cy.wait(800); // beri waktu form stabil sebelum diubah
};

// Simpan lalu tunggu request simpan profil selesai (pola URL sama dengan CY-PROFIL-017)
const simpanProfil = () => {
    cy.intercept({ method: /PUT|PATCH|POST/, url: /\/api\/.*profile/ }).as("simpanProfil");
    tombolSimpan().click();
    cy.wait("@simpanProfil");
};

const bukaEditDariProfil = () => {
    cy.visit(PROFIL);
    cy.contains("button, a", /edit profil/i).click();
    cy.location("pathname").should("eq", EDIT);
    inputNama().should("exist");
    inputNama().should("have.value", NAMA_08); // akun uji AKUN-08 sudah dipulihkan di beforeEach; tunggu sampai data dari server terisi
    cy.wait(800); // beri waktu form stabil sebelum diubah
};

const bukaGantiSandiDariProfil = () => {
    cy.visit(PROFIL);
    cy.contains(/ganti (kata sandi|password)/i).click();
    cy.location("pathname").should("eq", GANTI_SANDI);
};

const isiSandi = (lama, baru, konfirmasi) => {
    if (lama !== null) fieldSandiLama().clear().type(lama, { log: false });
    if (baru !== null) fieldSandiBaru().clear().type(baru, { log: false });
    if (konfirmasi !== null) fieldKonfirmasi().clear().type(konfirmasi, { log: false });
};

const gantiSandiViaUi = (lama, baru) => {
    cy.visit(GANTI_SANDI);
    isiSandi(lama, baru, baru);
    tombolSimpan().click();
    adaPesan(RE_BERHASIL);
};

const kembalikanProfil08 = () => {
    bukaEdit();
    inputNama().clear().type(NAMA_08);
    pilihJenjang("Semua");
    // Tombol Simpan Perubahan hanya muncul bila ada perubahan; kalau data sudah sama, tidak perlu disimpan
    cy.get("body").then(($b) => {
        const simpan = $b.find("button").filter((_, el) => /^simpan/i.test(el.textContent.trim()));
        if (simpan.length) {
            cy.intercept({ method: /PUT|PATCH|POST/, url: /\/api\/.*profile/ }).as("pulihProfil");
            cy.wrap(simpan.first()).click();
            cy.wait("@pulihProfil");
            adaPesan(RE_BERHASIL);
        }
    });
};

// Alur avatar di aplikasi: klik "Ganti Avatar" -> daftar "Pilih Avatar Karakter" (8 pilihan) -> klik satu avatar -> klik "Pilih Avatar" -> tombol "Simpan Perubahan" muncul.
// Avatar utama = gambar terbesar di area utama halaman (gambar di daftar pilihan avatar berukuran kecil dan
// tetap ada di halaman walau daftarnya tertutup, jadi "gambar pertama" tidak bisa dipakai).
const srcAvatarUtama = () =>
    cy.get("main img").then(($im) => {
        const terbesar = [...$im].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
        return terbesar.getAttribute("src");
    });

// Memilih avatar dari daftar sistem. Avatar yang sedang dipakai ikut ada di daftar, jadi dicoba satu per satu
// sampai avatar utama benar-benar berubah. Hasilnya disimpan di alias @avatarBaru.
const gantiAvatar = () => {
    srcAvatarUtama().as("avatarAwal");
    const coba = (i) => {
        cy.contains("button", /ganti avatar/i).click();
        cy.contains(/pilih avatar karakter/i).should("be.visible");
        // daftar avatar = ancestor terdekat dari judul daftar yang berisi lebih dari satu gambar
        cy.contains(/pilih avatar karakter/i)
            .parents()
            .filter((_, el) => el.querySelectorAll("img").length >= 2)
            .first()
            .find("img")
            .eq(i)
            .click({ force: true });
        cy.contains("button", /^\s*pilih avatar\s*$/i).click();
        cy.wait(300);
        srcAvatarUtama().then((src) => {
            cy.get("@avatarAwal").then((awal) => {
                if (src === awal && i < 7) {
                    coba(i + 1); // yang terpilih ternyata avatar yang sama, coba yang berikutnya
                } else {
                    expect(src, "avatar utama berubah setelah Pilih Avatar").to.not.eq(awal);
                    cy.wrap(src).as("avatarBaru");
                }
            });
        });
    };
    coba(0);
};
// Avatar utama di halaman sudah avatar baru (bukan yang lama)
const cekAvatarTampil = (baru) => {
    cy.get("@avatarAwal").then((awal) => {
        cy.get("main img").should(($im) => {
            const terbesar = [...$im].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
            const src = terbesar.getAttribute("src");
            expect(src, "avatar utama = avatar baru").to.eq(baru);
            expect(src, "avatar utama bukan avatar lama").to.not.eq(awal);
        });
    });
};

// ------------------------------------------------------------------ baca saja (AKUN-01)

describe("Profil: tampilan (AKUN-01)", () => {
    beforeEach(() => {
        alerts = [];
        cy.on("window:alert", (t) => alerts.push(t));
        cy.clearAllLocalStorage();
        login(EMAIL_01, PASS_01);
    });

    it("CY-PROFIL-001 membuka halaman Profil dari menu", () => {
        cy.contains("a, button", /^profil$/i).click();
        cy.location("pathname").should("eq", PROFIL);
        cy.contains(/nama lengkap/i).should("be.visible");
        cy.contains(EMAIL_01).should("be.visible");
        cy.contains(/jenjang belajar/i).should("be.visible");
        cy.get("img").should("exist"); // avatar
        cy.contains("Pelajar Tamu").should("not.exist"); // data contoh lama
    });

    it("CY-PROFIL-002 data di halaman Profil hanya bisa dibaca", () => {
        cy.visit(PROFIL);
        cy.contains(EMAIL_01).should("be.visible");
        cy.get("input:not([type=hidden]), select, textarea").should("not.exist");
        cy.contains("button, a", /edit profil/i).should("be.visible");
    });

    it("CY-PROFIL-006 form Edit Profil menampilkan data saat ini", () => {
        cy.visit(PROFIL);
        cy.contains("button, a", /edit profil/i).click();
        cy.location("pathname").should("eq", EDIT);
        inputNama().invoke("val").should("not.be.empty");
        inputEmail().should("have.value", EMAIL_01);
        cy.contains("button", /ganti avatar/i).should("be.visible");
        cekOpsiJenjang(["SD", "SMP", "SMA", "Semua"]);
        cy.contains(/terakhir diperbarui/i).should("be.visible");
    });

    it("CY-PROFIL-007 email tidak dapat diubah", () => {
        bukaEdit();
        inputEmail().then(($i) => {
            const terkunci = $i.is(":disabled") || $i.is("[readonly]");
            expect(terkunci, "field email nonaktif/read-only").to.equal(true);
        });
        inputEmail().should("have.value", EMAIL_01);
        cy.contains(/permanen/i).should("be.visible");
    });

    it("CY-PROFIL-011 tidak ada opsi unggah gambar sendiri", () => {
        bukaEdit();
        cy.contains("button", /ganti avatar/i).click();
        cy.get('input[type="file"]').should("not.exist");
        cy.contains(/unggah|upload/i).should("not.exist");
    });

    it("CY-PROFIL-018 form Ganti Kata Sandi tampil", () => {
        cy.visit(PROFIL);
        cy.contains(/ganti (password|kata sandi)/i).click();
        cy.location("pathname").should("eq", GANTI_SANDI);
        fieldSandiLama().should("be.visible");
        fieldSandiBaru().should("be.visible");
        fieldKonfirmasi().should("be.visible");
        cy.contains("button", /^batal$/i).should("be.visible");
        tombolSimpan().should("be.visible");
    });

    it("CY-PROFIL-019 istilah 'kata sandi' dipakai (bukan 'password')", () => {
        cy.visit(PROFIL);
        cy.get("body").invoke("text").should("not.match", /password/i);
        cy.visit(GANTI_SANDI);
        cy.get("body").invoke("text").should("not.match", /password/i);
        fieldSandiBaru().type("a", { log: false }); // daftar syarat baru tampil setelah mengetik
        cy.contains(/belum kuat|memenuhi syarat/i).should("be.visible");
        cy.get("body").invoke("text").should("not.match", /password/i);
        cy.get("input").each(($i) => {
            expect(($i.attr("placeholder") || "").toLowerCase()).to.not.contain("password");
        });
    });

    it("CY-PROFIL-028 kata sandi tersembunyi secara default", () => {
        cy.visit(GANTI_SANDI);
        isiSandi("Contoh123", "Contoh123", "Contoh123");
        cy.get('input[placeholder*="saat ini" i]').should("have.attr", "type", "password");
        fieldSandiBaru().should("have.attr", "type", "password");
        fieldKonfirmasi().should("have.attr", "type", "password");
    });

    it("CY-PROFIL-029 tampilkan dan sembunyikan kata sandi", () => {
        cy.visit(GANTI_SANDI);
        isiSandi("Contoh123", "Contoh123", "Contoh123");
        [fieldSandiLama, fieldSandiBaru, fieldKonfirmasi].forEach((field) => {
            // ikon mata = tombol di dalam pembungkus field
            field().parent().find("button").click();
            field().should("have.attr", "type", "text");
            field().parent().find("button").click();
            field().should("have.attr", "type", "password");
        });
    });

    it("CY-PROFIL-005 gagal mengambil data profil lalu coba lagi", () => {
        // Halaman /profile tidak memanggil server; pengambilan data profil terjadi di Edit Profil (GET /api/profile).
        cy.intercept({ method: "GET", url: /\/api\/profile/ }, { forceNetworkError: true }).as("profilGagal"); // seperti request diblokir: server tidak terjangkau
        cy.visit(EDIT);
        cy.wait("@profilGagal");
        cy.contains(/profil gagal dimuat dari server/i).should("be.visible");
        // Coba lagi: aplikasi tidak punya tombol "Coba lagi"; pengguna memuat ulang halaman setelah server pulih.
        cy.intercept({ method: "GET", url: /\/api\/profile/ }, (req) => req.continue()).as("profilPulih");
        cy.reload();
        cy.wait("@profilPulih");
        cy.contains(/profil gagal dimuat dari server/i).should("not.exist");
        inputEmail().should("have.value", EMAIL_01);
    });

    it("CY-PROFIL-036 menu Keluar menampilkan konfirmasi keluar", () => {
        cy.visit(PROFIL);
        cy.contains(/^\s*keluar\s*$/i).click(); // judul menu "Keluar" (di bawahnya ada keterangan "Keluar dari akun ini")
        cy.contains(/konfirmasi keluar/i).should("be.visible");
        cy.contains("button", /^\s*ya, keluar\s*$/i).should("be.visible");
        cy.contains("button", /^\s*batal\s*$/i).click();
        cy.contains(/konfirmasi keluar/i).should("not.exist");
        cy.location("pathname").should("eq", PROFIL);
        cy.reload();
        cy.contains(EMAIL_01).should("be.visible"); // masih login
    });
});

describe("Profil: tanpa login", () => {

    it("CY-PROFIL-004 membuka halaman Profil tanpa login", () => {
        cy.clearAllLocalStorage();
        [PROFIL, EDIT, GANTI_SANDI].forEach((url) => {
            cy.visit(url);
            cy.location("pathname").should("eq", "/login");
        });
    });
});

describe("Profil: Edit Profil (AKUN-08)", () => {
    beforeEach(() => {
        alerts = [];
        cy.on("window:alert", (t) => alerts.push(t));
        cy.clearAllLocalStorage();
        login(EMAIL_08, PASS_08);
        kembalikanProfil08(); // mulai dari data dasar (nama asli, jenjang Semua)
    });

    it("CY-PROFIL-009 mengubah jenjang dan materi BAB menyesuaikan", () => {
        bukaEdit();
        pilihJenjang("SMP");
        simpanProfil();
        adaPesan(RE_BERHASIL);
        cy.visit(PROFIL);
        cy.contains("SMP").should("be.visible");
        cy.visit(HALAMAN_BAB);
        // Jenjang SMP -> BAB berlabel Kelas 7-9, tidak ada Kelas 1-6
        cy.contains(/Kelas 7/).should("be.visible");
        cy.contains(/Kelas [1-6]\b/).should("not.exist");
        kembalikanProfil08();
        cy.visit(HALAMAN_BAB);
        // Kembali ke jenjang Semua -> BAB semua kelas tampil lagi (ada Kelas 1 dan Kelas 7)
        cy.contains(/Kelas 1\b/).should("exist");
        cy.contains(/Kelas 7/).should("exist");
    });

    it("CY-PROFIL-010 mengganti avatar dari daftar sistem", () => {
        bukaEdit();
        gantiAvatar();
        simpanProfil();
        adaPesan(RE_BERHASIL);
        cy.visit(PROFIL);
        cy.get("@avatarBaru").then((baru) => cekAvatarTampil(baru));
        cy.reload();
        cy.get("@avatarBaru").then((baru) => cekAvatarTampil(baru)); // tetap setelah reload
        // Avatar tidak dikembalikan; AKUN-08 didaftarkan ulang sebelum tiap run.
    });

    it("CY-PROFIL-012 mengubah beberapa data sekaligus", () => {
        const namaBaru = "QA Akun Delapan Multi";
        bukaEdit();
        inputNama().clear().type(namaBaru);
        pilihJenjang("SD");
        gantiAvatar();
        simpanProfil();
        adaPesan(RE_BERHASIL);
        cy.visit(PROFIL);
        cy.contains(namaBaru).should("be.visible");
        cy.contains("SD").should("be.visible");
        cy.get("@avatarBaru").then((baru) => cekAvatarTampil(baru));
        kembalikanProfil08();
    });

    it("CY-PROFIL-008 mengubah nama", () => {
        const namaBaru = "QA Akun Delapan Edit";
        bukaEdit();
        inputNama().clear().type(namaBaru);
        simpanProfil();
        adaPesan(RE_BERHASIL);
        cy.visit(PROFIL);
        cy.contains(namaBaru).should("be.visible");
        cy.reload();
        cy.contains(namaBaru).should("be.visible");
        // Langkah 5: buka Edit Profil lagi; tanggal "Terakhir diperbarui" = hari ini (format tampilan: "3 Okt 2026")
        bukaEdit();
        inputNama().should("have.value", namaBaru);
        cy.contains(/terakhir diperbarui/i).should("contain.text", tanggalHariIni());
        kembalikanProfil08();
    });

    it("CY-PROFIL-013 nama kosong", () => {
        bukaEdit();
        inputNama().clear();
        tombolSimpan().click();
        adaPesan(RE_NAMA_KOSONG);
        cy.location("pathname").should("eq", EDIT);
        cy.visit(PROFIL);
        cy.contains(NAMA_08).should("be.visible");
    });

    it("CY-PROFIL-014 nama hanya berisi spasi", () => {
        bukaEdit();
        inputNama().clear().type("   ");
        tombolSimpan().click();
        adaPesan(RE_NAMA_KOSONG);
        cy.visit(PROFIL);
        cy.contains(NAMA_08).should("be.visible");
    });

    it("CY-PROFIL-015 nama berisi tag HTML atau script", () => {
        const stub = cy.stub().as("alertXss");
        cy.on("window:alert", (t) => { if (t === "1") stub(t); });
        bukaEdit();
        inputNama().clear().type("<script>alert(1)</script>", { parseSpecialCharSequences: false });
        simpanProfil();
        adaPesan(RE_BERHASIL); // tunggu simpan selesai sebelum pindah halaman
        cy.visit(PROFIL);
        cy.get("@alertXss").should("not.have.been.called");
        // Aman bila tidak ada script yang berjalan dan tidak ada elemen <script> dari input.
        // Teks nama boleh ditolak, tampil apa adanya, atau dibersihkan; lihat screenshot untuk isi sebenarnya.
        cy.get("#root script").should("not.exist");
        cy.get("main").invoke("text").then((t) => cy.log("Isi halaman Profil setelah simpan: " + t.slice(0, 200)));
        kembalikanProfil08();
    });

    it("CY-PROFIL-016 batal mengedit profil", () => {
        bukaEditDariProfil(); // masuk lewat Profil agar tombol kembali punya halaman asal
        inputNama().clear().type("Tidak Disimpan");
        pilihJenjang("SMA");
        // Tombol "Simpan Perubahan" baru muncul setelah ada perubahan; Edit Profil tidak punya tombol Batal, hanya panah kembali
        tombolSimpan().should("be.visible");
        cy.get("body").then(($b) => {
            const panah = $b.find('button:has(svg[class*="arrow-left" i]), a:has(svg[class*="arrow-left" i])');
            if (panah.length) cy.wrap(panah.first()).click();
            else cy.get("main button, main a").first().click();
        });
        cy.location("pathname").should("eq", PROFIL);
        cy.contains("Tidak Disimpan").should("not.exist");
        bukaEdit();
        inputNama().should("have.value", NAMA_08);
    });

    it("CY-PROFIL-017 gagal menyimpan perubahan profil", () => {
        cy.intercept({ method: /PUT|PATCH|POST/, url: /\/api\/.*profile/ }, { statusCode: 500, body: { message: "error" } }).as("simpanGagal");
        bukaEdit();
        inputNama().clear().type("Gagal Simpan");
        tombolSimpan().click();
        cy.wait("@simpanGagal");
        adaPesan(RE_GAGAL);
        cy.visit(PROFIL);
        cy.contains("Gagal Simpan").should("not.exist");
        cy.contains(NAMA_08).should("be.visible");
    });
});

describe("Profil: Ganti Kata Sandi (AKUN-08)", () => {
    beforeEach(() => {
        alerts = [];
        cy.on("window:alert", (t) => alerts.push(t));
        cy.clearAllLocalStorage();
        login(EMAIL_08, PASS_08);
        cy.visit(GANTI_SANDI);
    });

    it("CY-PROFIL-020 ganti kata sandi berhasil", () => {
        isiSandi(PASS_08, PASS_BARU_8, PASS_BARU_8);
        tombolSimpan().click();
        adaPesan(RE_BERHASIL);
        cy.location("pathname").should("eq", PROFIL);
        // Kata sandi lama sudah tidak berlaku
        keluar();
        cy.visit("/login");
        cy.get('input[type="email"]').type(EMAIL_08);
        cy.get('input[type="password"]').type(PASS_08, { log: false });
        cy.contains("button", /^masuk$/i).click();
        adaPesan(new RegExp(PESAN_GENERIK, "i"));
        // Kata sandi baru berlaku
        login(EMAIL_08, PASS_BARU_8);
        // Kembalikan kata sandi AKUN-08
        gantiSandiViaUi(PASS_BARU_8, PASS_08);
        keluar();
        login(EMAIL_08, PASS_08);
    });

    it("CY-PROFIL-021 kata sandi lama salah", () => {
        isiSandi("SalahLama123", PASS_BARU, PASS_BARU);
        tombolSimpan().click();
        pesanErrorSandi().should("be.visible").invoke("text").then((t) => {
            cy.log("Pesan aplikasi: " + t);
            expect(t, "pesan soal kata sandi lama").to.match(/(salah|tidak sesuai|tidak cocok|keliru)/i);
            expect(t, "bukan pesan syarat kata sandi baru").to.not.match(/belum memenuhi ketentuan/i);
        });
        cy.location("pathname").should("eq", GANTI_SANDI);
        keluar();
        login(EMAIL_08, PASS_08); // kata sandi tidak berubah
    });

    [
        ["CY-PROFIL-022", "kurang dari 8 karakter", "Nolla12"],
        ["CY-PROFIL-023", "tanpa huruf besar", "nolla1234"],
        ["CY-PROFIL-024", "tanpa huruf kecil", "NOLLA1234"],
        ["CY-PROFIL-025", "tanpa angka", "NollaNolla"],
    ].forEach(([id, judul, sandi]) => {
        it(`${id} kata sandi baru ${judul}`, () => {
            isiSandi(PASS_08, sandi, sandi);
            tombolSimpan().click();
            pesanErrorSandi().should("be.visible").and("contain.text", "Kata sandi baru belum memenuhi ketentuan.");
            cy.location("pathname").should("eq", GANTI_SANDI);
        });
    });

    it("CY-PROFIL-026 konfirmasi kata sandi tidak cocok", () => {
        isiSandi(PASS_08, "Nolla1234", "Nolla1235");
        tombolSimpan().click();
        pesanErrorSandi().should("be.visible").and("contain.text", "Konfirmasi kata sandi tidak sesuai.");
        cy.location("pathname").should("eq", GANTI_SANDI);
    });

    it("CY-PROFIL-027 field kata sandi kosong", () => {
        tombolSimpan().click();
        cy.location("pathname").should("eq", GANTI_SANDI);
        pesanErrorSandi().should("be.visible").and("contain.text", "Kata sandi baru belum memenuhi ketentuan.");
        fieldSandiLama().type(PASS_08, { log: false });
        tombolSimpan().click();
        cy.location("pathname").should("eq", GANTI_SANDI);
        pesanErrorSandi().should("be.visible");
    });

    it("CY-PROFIL-033 akun email: kolom kata sandi saat ini tampil dan wajib diisi", () => {
        fieldSandiLama().should("be.visible").and("be.enabled"); // kolom ini hanya disembunyikan untuk akun tanpa kata sandi (AF 4b.1a)
        isiSandi(null, PASS_BARU, PASS_BARU);
        tombolSimpan().click();
        cy.location("pathname").should("eq", GANTI_SANDI);
        // Expected TC revisi 4 (Exc 4b.4b)
        pesanErrorSandi().should("be.visible").and("contain.text", "Kata sandi baru belum memenuhi ketentuan.");
        keluar();
        login(EMAIL_08, PASS_08); // kata sandi tidak berubah
    });

    it("CY-PROFIL-030 batal mengganti kata sandi", () => {
        bukaGantiSandiDariProfil();
        isiSandi(PASS_08, PASS_BARU, PASS_BARU);
        cy.contains("button", /^batal$/i).click();
        // UCS 4b.2a: Batal mengosongkan form dan tetap di halaman; 4b.2b: tombol kembali ke Profil
        cy.location("pathname").should("eq", GANTI_SANDI);
        fieldSandiLama().should("have.value", "");
        fieldSandiBaru().should("have.value", "");
        fieldKonfirmasi().should("have.value", "");
        cy.get('button[title="Kembali ke Profil"]').click();
        cy.location("pathname").should("eq", PROFIL);
        keluar();
        login(EMAIL_08, PASS_08); // kata sandi lama masih berlaku
    });

    it("CY-PROFIL-031 gagal menyimpan kata sandi baru", () => {
        cy.intercept({ method: /PUT|PATCH|POST/, url: /\/api\/.*(profile|password)/ }, { statusCode: 500, body: { message: "error" } }).as("sandiGagal");
        isiSandi(PASS_08, PASS_BARU, PASS_BARU);
        tombolSimpan().click();
        cy.wait("@sandiGagal");
        adaPesan(RE_GAGAL);
        cy.location("pathname").should("eq", GANTI_SANDI);
        keluar();
        login(EMAIL_08, PASS_08); // kata sandi lama masih berlaku
    });

    it("CY-PROFIL-035 kata sandi baru sama dengan kata sandi saat ini", () => {
        isiSandi(PASS_08, PASS_08, PASS_08);
        // Syarat "tidak sama dengan kata sandi saat ini" tampil dan belum terpenuhi (bukan hijau)
        cy.contains("span", /tidak sama dengan (kata sandi|password) saat ini/i)
            .parent().should("not.have.class", "text-green-600");
        tombolSimpan().click();
        pesanErrorSandi().should("be.visible").and("contain.text", "Kata sandi baru belum memenuhi ketentuan.");
        cy.location("pathname").should("eq", GANTI_SANDI);
        keluar();
        login(EMAIL_08, PASS_08); // kata sandi tidak berubah
    });
});