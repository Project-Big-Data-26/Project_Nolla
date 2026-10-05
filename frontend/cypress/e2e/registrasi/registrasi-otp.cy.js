// TC-Registrasi (Melakukan Registrasi Akun): alur lengkap dengan OTP asli.
// Kode OTP diketik tester dari email; sisanya otomatis.
//   AKUN-02: CY-REG-004, 019, 020, 006, 009, 008, 034, 033
//   AKUN-03: CY-REG-032, 007 (bagian ini dilewati kalau AKUN03_* belum diisi)
// Jalankan: npm run cy:registrasi:otp   (browser Chrome terbuka; jangan ditutup)
// Butuh di cypress.env.json: AKUN02_EMAIL, AKUN02_PASSWORD, AKUN03_EMAIL, AKUN03_PASSWORD
//
// Sebelum run: hapus AKUN-02 dan AKUN-03 dari MongoDB.
// Saat Command Log menampilkan "Ketik kode OTP…": buka email akun itu, ketik
// 6 digit kode di kotak OTP pada browser Cypress, lalu klik "Verifikasi OTP".
// Batas waktunya 9 menit.
//
// Catatan:
// - 019 dan 020 memakai backend asli (kode 11111 dan 111111). Kalau kode asli
//   dari email ikut ditolak setelah 020, itu temuan: catat dan laporkan.
// - 032 memakai respons server tiruan (500) untuk simpan jenjang, lalu halaman
//   dimuat ulang dan 007 menyimpan jenjang SMP dengan backend asli.
// - Setelah run, AKUN-02 siap dipakai TC-Profil (jenjang "Semua").
//   AKUN-03 (jenjang SMP) siap dipakai TC-Memulihkan Kata Sandi.
// - Kode akun mengikuti Daftar_Akun_Uji_NOLLA.xlsx (AKUN-02 dan AKUN-03 dulu ditulis AKUN-08 dan AKUN-09).

import {
    TEKS,
    harusMunculPesan,
    isiForm,
    klikDaftarAkun,
    loginLewatForm,
    pantauRequestApi,
    rekamTeksAwal,
    teksTampil,
} from '../../support/registrasi'

const BATAS_TUNGGU_OTP = 9 * 60 * 1000

const AKUN02 = {
    kode: 'AKUN-02',
    nama: 'QA Akun Dua',
    email: Cypress.env('AKUN02_EMAIL'),
    sandi: Cypress.env('AKUN02_PASSWORD'),
}
const AKUN03 = {
    kode: 'AKUN-03',
    nama: 'QA Akun Tiga',
    email: Cypress.env('AKUN03_EMAIL'),
    sandi: Cypress.env('AKUN03_PASSWORD'),
}

function cekEnvAkun(akun) {
    expect(akun.email, `${akun.kode}: email di cypress.env.json`).to.be.a('string').and.have.length.greaterThan(0)
    expect(akun.sandi, `${akun.kode}: kata sandi di cypress.env.json`).to.be.a('string').and.have.length.greaterThan(0)
}

function kotakOtp() {
    return cy.get('input')
}

function ketikOtp(kode) {
    kode.split('').forEach((angka, i) => kotakOtp().eq(i).type(angka))
}

function kosongkanOtp() {
    kotakOtp().each(($kotak) => cy.wrap($kotak).clear())
}

function klikVerifikasi() {
    cy.contains('button', 'Verifikasi OTP').click()
}

// Isi form registrasi dan pastikan sampai di /verify (request registrasi 2xx).
function daftarSampaiVerifikasi(akun) {
    cy.intercept({ method: 'POST', url: /\/api\// }).as('kirimRegistrasi')
    isiForm({ nama: akun.nama, email: akun.email, sandi: akun.sandi, konfirmasi: akun.sandi })
    klikDaftarAkun()
    cy.wait('@kirimRegistrasi', { requestTimeout: 10000, responseTimeout: 60000 })
        .its('response')
        .then((respons) => {
            const pesan = respons.body && respons.body.message ? respons.body.message : '(tanpa pesan)'
            expect(
                respons.statusCode,
                `status registrasi ${akun.kode}; pesan server: "${pesan}" (400 dengan "sudah terdaftar" berarti ${akun.kode} masih ada di MongoDB; 429 berarti kena pembatas request: restart backend)`,
            ).to.be.within(200, 299)
        })
    cy.location('pathname', { timeout: 10000 }).should('eq', '/verify')
}

// Tunggu tester mengetik kode OTP dari email lalu klik "Verifikasi OTP".
function tungguOtpDariTester(akun) {
    cy.log(`**Ketik kode OTP dari email ${akun.email} di 6 kotak, lalu klik "Verifikasi OTP".** Batas 9 menit.`)
    cy.location('pathname', { timeout: BATAS_TUNGGU_OTP }).should('not.eq', '/verify')
    cy.location('pathname').should('eq', '/personalization')
}

// Hanya nama kunci Local Storage yang ditampilkan di laporan, bukan isi token.
function cekTokenTersimpan() {
    cy.window().then((win) => {
        const kunci = Object.keys(win.localStorage)
        const isi = kunci.map((k) => `${k}=${win.localStorage.getItem(k)}`).join('\n')
        const daftarKunci = kunci.join(', ') || 'kosong'
        expect(/access/i.test(isi), `access token tersimpan (kunci Local Storage: ${daftarKunci})`).to.equal(true)
        expect(/refresh/i.test(isi), `refresh token tersimpan (kunci Local Storage: ${daftarKunci})`).to.equal(true)
    })
}

function bukaHalamanJenjang() {
    cy.location('pathname').then((halaman) => {
        if (halaman !== '/personalization') cy.visit('/personalization')
    })
    cy.contains(TEKS.judulJenjang, { timeout: 10000 }).should('be.visible')
}

function klikSimpanJenjang() {
    cy.contains('button', 'Simpan & Mulai Belajar').click()
}

// Pastikan jenjang yang sedang terpilih di halaman Profil (area berlabel "Jenjang Belajar").
// Mendukung <select> asli maupun dropdown buatan (teks tombol pemicunya).
// Kalau area itu baru muncul setelah tombol edit diklik, tombolnya diklik dulu.
function harusJenjangProfil(akun, pola, pesan) {
    const adaLabelJenjang = ($body) =>
        $body.find('label').filter((_, el) => /jenjang belajar/i.test(el.textContent)).length > 0
    // Tunggu sampai halaman Profil selesai dimuat (ada label jenjang atau tombol edit).
    cy.contains(/jenjang belajar|edit|ubah/i, { timeout: 10000 }).should('exist')
    cy.get('body').then(($body) => {
        if (adaLabelJenjang($body)) return
        const tombol = $body.find('button, a').filter((_, el) => /edit|ubah/i.test(el.textContent))
        const daftar = [...$body.find('button, a')].map((el) => el.textContent.trim()).filter(Boolean).join(' | ')
        expect(tombol.length, `tombol edit profil (tombol yang ada di halaman: ${daftar})`).to.be.greaterThan(0)
        const utama = tombol.filter((_, el) => /edit profil|ubah profil/i.test(el.textContent))
        cy.wrap((utama.length ? utama : tombol).first()).click()
    })
    // Form Edit Profil menampilkan data bawaan ("Pelajar Tamu", guest@mathmentor.app,
    // jenjang "Semua") sampai GET /api/profile selesai. Tunggu kolom Email berisi
    // email akun ini dulu, baru jenjangnya dibaca.
    cy.contains('label', /^\s*email\s*$/i, { timeout: 10000 })
        .parent()
        .find('input', { timeout: 30000 })
        .should(($input) => {
            expect($input.val(), `${akun.kode}: data profil termuat (kolom Email di Edit Profil)`).to.equal(akun.email)
        })
    cy.contains('label', /jenjang belajar/i, { timeout: 10000 })
        .parent()
        .should(($area) => {
            const $select = $area.find('select')
            let nilai
            if ($select.length) nilai = $select.find('option:selected').text().trim()
            else {
                const $pemicu = $area.find('button, [role=combobox], [role=button], [aria-haspopup]').first()
                nilai = ($pemicu.length ? $pemicu.text() : $area.text()).trim()
            }
            expect(nilai, pesan).to.match(pola)
        })
}

describe('AKUN-02: registrasi lewat form, OTP, lalu lewati pemilihan jenjang', { testIsolation: false }, () => {
    const teksHalaman = {}

    before(() => {
        cekEnvAkun(AKUN02)
        cy.clearLocalStorage()
        cy.clearCookies()
    })

    it('CY-REG-004 Registrasi lewat form dengan data valid', () => {
        cy.visit('/register')
        cy.document().then((doc) => {
            teksHalaman['/register'] = teksTampil(doc)
        })
        daftarSampaiVerifikasi(AKUN02)
        cy.contains(TEKS.daftarBerhasil).should('be.visible')
        cy.contains(TEKS.otpTerkirim).should('be.visible')
        cy.contains('Verifikasi Kode OTP').should('be.visible')
        cy.contains(AKUN02.email).should('be.visible')
        kotakOtp().should('have.length', 6)
        cy.contains('button', 'Verifikasi OTP').should('be.visible')
        // Rekam teks /verify lebih dulu, supaya CY-REG-033 tetap punya data walau pengecekan di bawah gagal.
        cy.document().then((doc) => {
            teksHalaman['/verify'] = teksTampil(doc)
        })
        cy.contains('Kembali ke Login').should('be.visible')
        // Pengiriman OTP pertama tidak punya jeda: tautan "Kirim ulang OTP" langsung bisa diklik,
        // tanpa hitung mundur. Hitung mundur baru muncul setelah kirim ulang (CY-REG-022).
        // Tautannya tidak diklik di sini supaya OTP yang diketik tester di 006 tetap berlaku.
        cy.contains('a, button', /^\s*Kirim ulang OTP\s*$/).should('be.visible').and('not.be.disabled')
        cy.document().then((doc) => {
            const baris = doc.body.innerText.split('\n').filter((s) => /ulang/i.test(s))
            expect(baris.join(' | '), 'tidak ada hitung mundur pada pengiriman OTP pertama').not.to.match(/\d{1,2}:\d{2}/)
        })
    })

    it('CY-REG-019 Kode OTP kurang dari 6 digit', () => {
        ketikOtp('11111')
        klikVerifikasi()
        cy.contains(TEKS.otpKurang).should('be.visible')
        cy.location('pathname').should('eq', '/verify')
    })

    it('CY-REG-020 Kode OTP salah', () => {
        kosongkanOtp()
        ketikOtp('111111')
        klikVerifikasi()
        cy.contains(TEKS.otpSalah, { timeout: 15000 }).should('be.visible')
        cy.location('pathname').should('eq', '/verify')
        kosongkanOtp()
    })

    it('CY-REG-006 Verifikasi OTP benar lalu masuk otomatis (OTP diketik tester)', () => {
        tungguOtpDariTester(AKUN02)
        cy.contains(TEKS.verifikasiBerhasil).should('be.visible')
        // Teks "Akun Anda telah aktif." sudah tidak ada di UI; pesan sukses kini dari backend (verifikasiBerhasil).
        cekTokenTersimpan()
        cy.contains(TEKS.judulJenjang).should('be.visible')
        cy.document().then((doc) => {
            teksHalaman['/personalization'] = teksTampil(doc)
        })
    })

    it('CY-REG-009 Menyimpan tanpa memilih jenjang', () => {
        bukaHalamanJenjang()
        klikSimpanJenjang()
        cy.contains(TEKS.peringatanJenjang).should('be.visible')
        cy.location('pathname').should('eq', '/personalization')
    })

    it('CY-REG-008 Melewati pemilihan jenjang', () => {
        let tujuan = ''
        bukaHalamanJenjang()
        cy.contains(/^\s*Lewati\s*$/).click()
        cy.location('pathname', { timeout: 15000 }).should('not.eq', '/personalization')
        cy.wait(1500) // beri waktu kalau ada pengalihan lanjutan (mis. /dashboard ke /topik)
        cy.location('pathname').then((halaman) => {
            tujuan = halaman
        })
        cy.visit('/topik')
        cy.contains(/Kelas 1\b/, { timeout: 15000 }).should('exist')
        cy.contains(/Kelas 7\b/).should('exist')
        cy.visit('/profile')
        harusJenjangProfil(AKUN02, /semua/i, 'jenjang di Profil setelah "Lewati"')
        cy.then(() => expect(tujuan, 'halaman tujuan setelah klik "Lewati"').to.equal('/topik'))
    })

    it('CY-REG-034 Data akun baru tampil di Profil dan bisa login manual', () => {
        cy.visit('/profile')
        cy.contains(AKUN02.nama, { timeout: 10000 }).should('be.visible')
        cy.contains(AKUN02.email).should('be.visible')
        harusJenjangProfil(AKUN02, /semua/i, 'jenjang di Profil')
        cy.clearLocalStorage()
        cy.clearCookies()
        loginLewatForm(AKUN02.email, AKUN02.sandi)
    })

    it('CY-REG-033 Istilah "kata sandi" di halaman Registrasi, Verifikasi, dan pemilihan jenjang', () => {
        const halaman = ['/register', '/verify', '/personalization']
        halaman.forEach((h) => {
            expect(teksHalaman[h], `teks halaman ${h} terekam oleh tes sebelumnya`).to.be.a('string')
            const baris = teksHalaman[h].split('\n').filter((s) => /password/i.test(s))
            expect(baris, `teks berisi "password" di ${h}`).to.have.length(0)
        })
    })
})

describe('AKUN-03: registrasi lewat form, OTP, lalu memilih jenjang SMP', { testIsolation: false }, () => {
    before(function () {
        if (!AKUN03.email || !AKUN03.sandi) this.skip()
        cy.clearLocalStorage()
        cy.clearCookies()
    })

    it('Persiapan: daftarkan AKUN-03 dan verifikasi OTP (OTP diketik tester)', () => {
        cy.visit('/register')
        daftarSampaiVerifikasi(AKUN03)
        tungguOtpDariTester(AKUN03)
    })

    it('CY-REG-032 Gagal menyimpan jenjang (respons server tiruan 500)', () => {
        const alerts = []
        cy.on('window:alert', (teks) => alerts.push(teks))
        const request = pantauRequestApi({
            balasan: { statusCode: 500, body: { success: false, message: 'Server error (stub CY-REG-032)' } },
        })
        bukaHalamanJenjang()
        cy.contains('(SMP)').click()
        rekamTeksAwal().then((awal) => {
            klikSimpanJenjang()
            harusMunculPesan(/stub CY-REG-032|gagal|kesalahan|error|server/i, awal, alerts)
        })
        cy.location('pathname').should('eq', '/personalization')
        cy.then(() => expect(request, 'request simpan jenjang (dibalas 500 tiruan)').to.have.length.greaterThan(0))
        cy.reload() // UCS Exc 9a.2: kembali ke halaman pemilihan jenjang
    })

    it('CY-REG-007 Memilih jenjang lalu materi BAB sesuai jenjang', () => {
        let tujuan = ''
        bukaHalamanJenjang()
        cy.contains(/Kelas 1\s*-\s*6/).should('be.visible')
        cy.contains(/Kelas 7\s*-\s*9/).should('be.visible')
        cy.contains(/Kelas 10\s*-\s*12/).should('be.visible')
        cy.contains('(SD)').should('be.visible')
        cy.contains('(SMP)').should('be.visible')
        cy.contains('(SMA)').should('be.visible')
        cy.contains(/^\s*Lewati\s*$/).should('be.visible')
        cy.contains('(SMP)').click()
        klikSimpanJenjang()
        cy.location('pathname', { timeout: 15000 }).should('not.eq', '/personalization')
        cy.wait(1500)
        cy.location('pathname').then((halaman) => {
            tujuan = halaman
        })
        cy.visit('/topik')
        cy.contains(/Kelas 7\b/, { timeout: 15000 }).should('exist')
        cy.contains(/Kelas [1-6]\b/).should('not.exist')
        cy.visit('/profile')
        harusJenjangProfil(AKUN03, /smp/i, 'jenjang di Profil setelah memilih SMP')
        // "/" dan "/topik" sama-sama merender halaman Topik untuk siswa yang sudah login, jadi keduanya diterima.
        // (Tombol "Simpan & Mulai Belajar" mengarah ke "/", tombol "Lewati" ke "/topik".)
        cy.then(() => expect(tujuan, 'halaman tujuan setelah "Simpan & Mulai Belajar"').to.be.oneOf(['/', '/topik']))
    })
})