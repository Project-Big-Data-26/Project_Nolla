// TC-Registrasi (Melakukan Registrasi Akun): alur lengkap dengan OTP asli.
// Kode OTP diketik tester dari email; sisanya otomatis.
//   AKUN-08: CY-REG-004, 019, 020, 006, 009, 008, 034, 033
//   AKUN-09: CY-REG-032, 007 (bagian ini dilewati kalau AKUN09_* belum diisi)
// Jalankan: npm run cy:registrasi:otp   (browser Chrome terbuka; jangan ditutup)
// Butuh di cypress.env.json: AKUN08_EMAIL, AKUN08_PASSWORD, AKUN09_EMAIL, AKUN09_PASSWORD
//
// Sebelum run: hapus AKUN-08 dan AKUN-09 dari MongoDB.
// Saat Command Log menampilkan "Ketik kode OTP…": buka email akun itu, ketik
// 6 digit kode di kotak OTP pada browser Cypress, lalu klik "Verifikasi OTP".
// Batas waktunya 9 menit.
//
// Catatan:
// - 019 dan 020 memakai backend asli (kode 11111 dan 111111). Kalau kode asli
//   dari email ikut ditolak setelah 020, itu temuan: catat dan laporkan.
// - 032 memakai respons server tiruan (500) untuk simpan jenjang, lalu halaman
//   dimuat ulang dan 007 menyimpan jenjang SMP dengan backend asli.
// - Setelah run, AKUN-08 siap dipakai TC-Profil (jenjang "Semua").

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

const AKUN08 = {
    kode: 'AKUN-08',
    nama: 'QA Akun Delapan',
    email: Cypress.env('AKUN08_EMAIL'),
    sandi: Cypress.env('AKUN08_PASSWORD'),
}
const AKUN09 = {
    kode: 'AKUN-09',
    nama: 'QA Akun Sembilan',
    email: Cypress.env('AKUN09_EMAIL'),
    sandi: Cypress.env('AKUN09_PASSWORD'),
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
        .its('response.statusCode')
        .then((status) => {
            expect(
                status,
                `status registrasi ${akun.kode} (4xx biasanya karena email sudah ada: hapus ${akun.kode} dari MongoDB)`,
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

describe('AKUN-08: registrasi lewat form, OTP, lalu lewati pemilihan jenjang', { testIsolation: false }, () => {
    const teksHalaman = {}

    before(() => {
        cekEnvAkun(AKUN08)
        cy.clearLocalStorage()
        cy.clearCookies()
    })

    it('CY-REG-004 Registrasi lewat form dengan data valid', () => {
        cy.visit('/register')
        cy.document().then((doc) => {
            teksHalaman['/register'] = teksTampil(doc)
        })
        daftarSampaiVerifikasi(AKUN08)
        cy.contains(TEKS.daftarBerhasil).should('be.visible')
        cy.contains(TEKS.otpTerkirim).should('be.visible')
        cy.contains('Verifikasi Kode OTP').should('be.visible')
        cy.contains(AKUN08.email).should('be.visible')
        kotakOtp().should('have.length', 6)
        cy.contains('button', 'Verifikasi OTP').should('be.visible')
        cy.contains(/Kirim ulang OTP dalam \d{1,2}:\d{2}/).should('be.visible')
        cy.contains('Kembali ke Login').should('be.visible')
        cy.document().then((doc) => {
            teksHalaman['/verify'] = teksTampil(doc)
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
        tungguOtpDariTester(AKUN08)
        cy.contains(TEKS.verifikasiBerhasil).should('be.visible')
        cy.contains(TEKS.akunAktif).should('be.visible')
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
        cy.contains('Semua', { timeout: 10000 }).should('be.visible')
        cy.then(() => expect(tujuan, 'halaman tujuan setelah klik "Lewati"').to.equal('/topik'))
    })

    it('CY-REG-034 Data akun baru tampil di Profil dan bisa login manual', () => {
        cy.visit('/profile')
        cy.contains(AKUN08.nama, { timeout: 10000 }).should('be.visible')
        cy.contains(AKUN08.email).should('be.visible')
        cy.contains('Semua').should('be.visible')
        cy.clearLocalStorage()
        cy.clearCookies()
        loginLewatForm(AKUN08.email, AKUN08.sandi)
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

describe('AKUN-09: registrasi lewat form, OTP, lalu memilih jenjang SMP', { testIsolation: false }, () => {
    before(function () {
        if (!AKUN09.email || !AKUN09.sandi) this.skip()
        cy.clearLocalStorage()
        cy.clearCookies()
    })

    it('Persiapan: daftarkan AKUN-09 dan verifikasi OTP (OTP diketik tester)', () => {
        cy.visit('/register')
        daftarSampaiVerifikasi(AKUN09)
        tungguOtpDariTester(AKUN09)
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
        cy.contains('SMP', { timeout: 10000 }).should('be.visible')
        cy.then(() => expect(tujuan, 'halaman tujuan setelah "Simpan & Mulai Belajar"').to.equal('/topik'))
    })
})