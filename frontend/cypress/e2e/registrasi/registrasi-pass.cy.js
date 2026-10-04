// TC-Registrasi (Melakukan Registrasi Akun): kasus yang diperkirakan Pass.
//   CY-REG-001, 002, 003, 011 (4 field), 012, 013, 018, 031, 035
// Jalankan: npm run cy:registrasi:pass
// Butuh di cypress.env.json: AKUN01_EMAIL, AKUN07_EMAIL
//
// Catatan:
// - Frontend dan backend asli. Tidak ada akun yang dibuat atau diubah.
// - 011 dan 012 memblokir request ke API, jadi email uji tidak akan pernah
//   terdaftar walaupun validasi form ternyata bolong.
// - 013: Cypress mengetik lewat skrip, sehingga browser tidak memunculkan pesan
//   minlength ("Please lengthen this text…"). Yang dicek di sini atribut
//   minlength=8; pesan browsernya sudah lolos uji manual 3 Okt 2026.
// - 031 memakai respons server tiruan (500), karena kegagalan server tidak bisa
//   dipicu dari UI.

import {
    EMAIL_NEGATIF,
    FIELD,
    SANDI_VALID,
    TEKS,
    harusMunculPesan,
    isiForm,
    isiLogin,
    klikDaftarAkun,
    klikMasuk,
    pantauRequestApi,
    rekamTeksAwal,
    wajibEnv,
} from '../../support/registrasi'

const DATA_VALID = { nama: 'QA Negatif', email: EMAIL_NEGATIF, sandi: SANDI_VALID, konfirmasi: SANDI_VALID }

const FIELD_WAJIB = [
    ['nama', 'Nama Lengkap'],
    ['email', 'Alamat Email'],
    ['sandi', 'Kata Sandi'],
    ['konfirmasi', 'Konfirmasi Kata Sandi'],
]

describe('TC-Registrasi: kasus yang diperkirakan Pass', () => {
    it('CY-REG-001 Halaman Registrasi tampil lengkap', () => {
        cy.visit('/login')
        cy.contains('a, button', 'Buat akun baru').click()
        cy.location('pathname').should('eq', '/register')
        cy.contains('Buat Akun Baru').should('be.visible')
        cy.contains('Mulai perjalanan belajarmu bersama kami hari ini!').should('be.visible')
        cy.contains('button', 'Daftar dengan Google').should('be.visible')
        cy.contains('atau isi formulir').should('be.visible')
        Object.values(FIELD).forEach((selector) => cy.get(selector).should('be.visible'))
        cy.contains(TEKS.petunjukSandi).should('be.visible')
        cy.contains('button', 'Daftar Akun').should('be.visible')
        cy.contains('Sudah memiliki akun?').should('be.visible')
        cy.contains('a, button', 'Masuk di sini').should('be.visible')
    })

    it('CY-REG-002 Tautan "Masuk di sini" menuju halaman Login', () => {
        cy.visit('/register')
        cy.contains('a, button', 'Masuk di sini').click()
        cy.location('pathname').should('eq', '/login')
    })

    it('CY-REG-003 Kata sandi tersembunyi dan bisa ditampilkan', () => {
        cy.visit('/register')
        const kolomSandi = [FIELD.sandi, FIELD.konfirmasi]
        kolomSandi.forEach((selector) => {
            cy.get(selector).type('Contoh123')
            cy.get(selector).should('have.attr', 'type', 'password')
            cy.get(selector).parent().find('button').first().click()
            cy.get(selector).should('have.attr', 'type', 'text').and('have.value', 'Contoh123')
            cy.get(selector).parent().find('button').first().click()
            cy.get(selector).should('have.attr', 'type', 'password')
        })
    })

    FIELD_WAJIB.forEach(([kunci, label]) => {
        it(`CY-REG-011 Field wajib kosong: ${label}`, () => {
            const request = pantauRequestApi({ blokir: true })
            cy.visit('/register')
            isiForm({ ...DATA_VALID, [kunci]: '' })
            klikDaftarAkun()
            cy.get(FIELD[kunci]).then(($el) => {
                expect($el[0].validity.valueMissing, `${label} ditandai wajib diisi`).to.equal(true)
                expect($el[0].validationMessage, 'pesan validasi browser').not.to.equal('')
            })
            cy.wait(1000) // beri waktu kalau form ternyata tetap mengirim request
            cy.location('pathname').should('eq', '/register')
            cy.then(() => expect(request, 'request registrasi yang terkirim').to.have.length(0))
        })
    })

    it('CY-REG-012 Format email tidak valid', () => {
        const request = pantauRequestApi({ blokir: true })
        cy.visit('/register')
        isiForm({ ...DATA_VALID, email: 'qa.nolla.akun08gmail.com' })
        klikDaftarAkun()
        cy.get(FIELD.email).then(($el) => {
            expect($el[0].validity.typeMismatch, 'email ditandai format salah').to.equal(true)
            expect($el[0].validationMessage, 'pesan validasi browser').to.contain('@')
        })
        cy.wait(1000)
        cy.location('pathname').should('eq', '/register')
        cy.then(() => expect(request, 'request registrasi yang terkirim').to.have.length(0))
    })

    it('CY-REG-013 Kata sandi kurang dari 8 karakter (atribut minlength)', () => {
        cy.visit('/register')
        cy.get(FIELD.sandi).should('have.attr', 'minlength', '8').and('have.attr', 'required')
        cy.contains(TEKS.petunjukSandi).should('be.visible')
    })

    it('CY-REG-018 Registrasi dengan email yang sudah terdaftar (AKUN-01)', () => {
        const emailAkun01 = wajibEnv('AKUN01_EMAIL')
        const request = pantauRequestApi()
        cy.visit('/register')
        isiForm({ nama: 'QA Duplikat', email: emailAkun01, sandi: SANDI_VALID, konfirmasi: SANDI_VALID })
        klikDaftarAkun()
        cy.contains(TEKS.emailTerdaftar, { timeout: 10000 }).should('be.visible')
        cy.location('pathname').should('eq', '/register')
        cy.get(FIELD.nama).should('have.value', 'QA Duplikat')
        cy.get(FIELD.email).should('have.value', emailAkun01)
        cy.then(() => {
            expect(request, 'request registrasi').to.have.length.greaterThan(0)
            request.forEach((r) => expect(r.status, `status ${r.method} ${r.url}`).to.be.within(400, 499))
        })
    })

    it('CY-REG-031 Gagal menyimpan akun (respons server tiruan 500)', () => {
        const alerts = []
        cy.on('window:alert', (teks) => alerts.push(teks))
        const request = pantauRequestApi({
            balasan: { statusCode: 500, body: { success: false, message: 'Server error (stub CY-REG-031)' } },
        })
        cy.visit('/register')
        isiForm(DATA_VALID)
        rekamTeksAwal().then((awal) => {
            klikDaftarAkun()
            harusMunculPesan(/stub CY-REG-031|gagal|kesalahan|error|server/i, awal, alerts)
        })
        cy.location('pathname').should('eq', '/register')
        cy.then(() => expect(request, 'request registrasi (dibalas 500 tiruan)').to.have.length.greaterThan(0))
    })

    it('CY-REG-035 Registrasi lewat form dengan email yang terdaftar lewat Google (AKUN-07)', () => {
        const emailAkun07 = wajibEnv('AKUN07_EMAIL')
        const alerts = []
        cy.on('window:alert', (teks) => alerts.push(teks))
        const request = pantauRequestApi()
        cy.visit('/register')
        isiForm({ nama: 'QA Duplikat Google', email: emailAkun07, sandi: SANDI_VALID, konfirmasi: SANDI_VALID })
        klikDaftarAkun()
        cy.contains(TEKS.emailTerdaftar, { timeout: 10000 }).should('be.visible')
        cy.location('pathname').should('eq', '/register')
        cy.then(() => {
            expect(request, 'request registrasi').to.have.length.greaterThan(0)
            request.forEach((r) => expect(r.status, `status ${r.method} ${r.url}`).to.be.within(400, 499))
        })
        // AKUN-07 harus tetap tanpa kata sandi: login dengan kata sandi tadi ditolak.
        isiLogin(emailAkun07, SANDI_VALID)
        rekamTeksAwal().then((awal) => {
            klikMasuk()
            harusMunculPesan(new RegExp(TEKS.loginGagal), awal, alerts)
        })
        cy.location('pathname').should('eq', '/login')
    })
})