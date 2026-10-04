// TC-Registrasi (Melakukan Registrasi Akun): kasus yang diperkirakan Fail
// atau perilakunya belum pasti.
//   CY-REG-010, 014, 015, 016, 017, 025, 030
// Jalankan: npm run cy:registrasi:fail
// Butuh di cypress.env.json: AKUN01_EMAIL, AKUN01_PASSWORD
//
// Catatan:
// - 010, 025, 030 sudah Fail di uji manual 3 Okt 2026 (halaman bisa dibuka
//   lewat URL). Tes ini dipakai untuk retest setelah developer memperbaiki.
// - 014–016 diteruskan ke backend asli dengan qa.nolla.reg.neg@example.com.
//   Kalau salah satunya lolos ke /verify, akun itu terbentuk: hapus dari MongoDB.
// - 017 memblokir request ke API; konfirmasi yang tidak cocok tidak boleh
//   sampai ke backend.
// - Screenshot 014–017 tersimpan di cypress/screenshots/registrasi-fail.cy.js/
//   untuk mengisi Actual Result. Folder screenshots dikosongkan setiap kali
//   `cypress run` dimulai, jadi ambil dulu sebelum menjalankan spec lain.

import {
    EMAIL_NEGATIF,
    TEKS,
    harusMunculPesan,
    isiForm,
    klikDaftarAkun,
    loginLewatForm,
    pantauRequestApi,
    rekamTeksAwal,
    wajibEnv,
} from '../../support/registrasi'

const SANDI_LEMAH = [
    { id: 'CY-REG-014', judul: 'Kata sandi tanpa huruf besar', sandi: 'nolla1234' },
    { id: 'CY-REG-015', judul: 'Kata sandi tanpa huruf kecil', sandi: 'NOLLA1234' },
    { id: 'CY-REG-016', judul: 'Kata sandi tanpa angka', sandi: 'NollaNolla' },
]

describe('TC-Registrasi: kasus yang diperkirakan Fail atau belum pasti', () => {
    SANDI_LEMAH.forEach(({ id, judul, sandi }) => {
        it(`${id} ${judul}`, () => {
            const alerts = []
            cy.on('window:alert', (teks) => alerts.push(teks))
            const request = pantauRequestApi()
            cy.visit('/register')
            isiForm({ nama: 'QA Negatif', email: EMAIL_NEGATIF, sandi, konfirmasi: sandi })
            rekamTeksAwal().then((awal) => {
                klikDaftarAkun()
                harusMunculPesan(/kata sandi|password|huruf|angka|format/i, awal, alerts)
            })
            cy.screenshot(id)
            cy.location('pathname').should('eq', '/register')
            cy.contains(TEKS.emailTerdaftar).should('not.exist')
            cy.then(() => {
                request.forEach((r) => {
                    expect(
                        r.status,
                        `status ${r.method} ${r.url} (2xx berarti akun terbentuk: hapus ${EMAIL_NEGATIF} dari MongoDB)`,
                    ).to.be.gte(400)
                })
            })
        })
    })

    it('CY-REG-017 Konfirmasi kata sandi tidak cocok', () => {
        const alerts = []
        cy.on('window:alert', (teks) => alerts.push(teks))
        const request = pantauRequestApi({ blokir: true })
        cy.visit('/register')
        isiForm({ nama: 'QA Negatif', email: EMAIL_NEGATIF, sandi: 'Nolla1234', konfirmasi: 'Nolla1235' })
        rekamTeksAwal().then((awal) => {
            klikDaftarAkun()
            harusMunculPesan(/cocok|sesuai|sama|match/i, awal, alerts)
        })
        cy.screenshot('CY-REG-017')
        cy.location('pathname').should('eq', '/register')
        cy.then(() => expect(request, 'request registrasi yang terkirim').to.have.length(0))
    })

    it('CY-REG-025 Membuka halaman verifikasi tanpa registrasi', () => {
        cy.visit('/verify')
        cy.location('pathname', { timeout: 8000 }).should('match', /^\/(register|login)$/)
    })

    it('CY-REG-030 Membuka halaman Registrasi saat sudah login (AKUN-01)', () => {
        loginLewatForm(wajibEnv('AKUN01_EMAIL'), wajibEnv('AKUN01_PASSWORD'))
        cy.visit('/register')
        cy.location('pathname', { timeout: 8000 }).should('eq', '/topik')
    })

    it('CY-REG-010 Halaman pemilihan jenjang hanya tampil sekali (AKUN-01)', () => {
        // Langkah 1: login akun yang sudah lewat tahap pemilihan jenjang -> langsung ke Bab Pembelajaran.
        loginLewatForm(wajibEnv('AKUN01_EMAIL'), wajibEnv('AKUN01_PASSWORD'))
        // Langkah 2: buka /personalization lewat URL -> seharusnya dialihkan. Tidak ada yang diklik di halaman ini.
        cy.visit('/personalization')
        cy.location('pathname', { timeout: 8000 }).should('eq', '/topik')
    })
})