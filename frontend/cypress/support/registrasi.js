// Helper bersama untuk spec TC-Registrasi (cypress/e2e/registrasi/).
// Selector memakai placeholder dan teks yang tampil di aplikasi per 3 Okt 2026,
// karena form registrasi belum punya data-testid.

export const FIELD = {
    nama: 'input[placeholder="Nama Lengkap"]',
    email: 'input[placeholder="Alamat Email"]',
    sandi: 'input[placeholder="Kata Sandi"]',
    konfirmasi: 'input[placeholder="Konfirmasi Kata Sandi"]',
}

export const TEKS = {
    petunjukSandi: 'Minimal 8 karakter, mencakup huruf besar, huruf kecil, dan angka.',
    emailTerdaftar: 'Email sudah terdaftar',
    // Notifikasi kini memakai pesan dari backend (authController.js), bukan teks tetap di frontend.
    daftarBerhasil: 'Registrasi berhasil',
    otpTerkirim: 'Silakan cek email Anda untuk kode verifikasi',
    otpKurang: 'Harap masukkan 6 digit kode OTP secara lengkap!',
    otpSalah: 'Kode OTP salah atau sudah kedaluwarsa',
    verifikasiBerhasil: 'Email berhasil diverifikasi',
    judulJenjang: 'Pilih Jenjang Pendidikanmu',
    peringatanJenjang: 'Harap pilih salah satu jenjang pendidikan sebelum melanjutkan.',
    loginGagal: 'Email atau kata sandi salah',
}

// Email untuk tes negatif yang tidak butuh kotak masuk (bukan akun uji).
export const EMAIL_NEGATIF = 'qa.nolla.reg.neg@example.com'
export const SANDI_VALID = 'Nolla1234'

// Ambil nilai dari cypress.env.json; gagal dengan pesan jelas kalau belum diisi.
export function wajibEnv(kunci) {
    const nilai = Cypress.env(kunci)
    expect(nilai, `${kunci} di cypress.env.json`).to.be.a('string').and.have.length.greaterThan(0)
    return nilai
}

// Isi form registrasi. Field yang tidak diberi nilai dibiarkan kosong.
export function isiForm({ nama, email, sandi, konfirmasi }) {
    if (nama) cy.get(FIELD.nama).clear().type(nama)
    if (email) cy.get(FIELD.email).clear().type(email)
    if (sandi) cy.get(FIELD.sandi).clear().type(sandi, { log: false })
    if (konfirmasi) cy.get(FIELD.konfirmasi).clear().type(konfirmasi, { log: false })
}

export function klikDaftarAkun() {
    cy.contains('button', 'Daftar Akun').click()
}

// Buka /login dan isi form tanpa menekan tombol "Masuk".
export function isiLogin(email, sandi) {
    cy.visit('/login')
    cy.get('input[type="email"]').clear().type(email)
    cy.get('input[type="password"]').clear().type(sandi, { log: false })
}

export function klikMasuk() {
    cy.contains('button', /^\s*Masuk\s*$/).click()
}

// Login lewat form dan pastikan masuk ke Bab Pembelajaran (/topik).
export function loginLewatForm(email, sandi) {
    isiLogin(email, sandi)
    klikMasuk()
    cy.location('pathname', { timeout: 15000 }).should('eq', '/topik')
}

// Catat request non-GET ke /api/ selama satu test.
//   tanpa opsi      -> diteruskan ke backend asli; status respons dicatat
//   blokir: true    -> dibalas 400 tiruan dan tidak sampai ke backend (untuk tes
//                      yang seharusnya tidak mengirim request sama sekali)
//   balasan: {...}  -> dibalas dengan respons tiruan ini (mis. status 500)
// Mengembalikan array { method, url, status } yang terisi selama test berjalan.
export function pantauRequestApi({ blokir = false, balasan = null } = {}) {
    const daftar = []
    cy.intercept(/\/api\//, (req) => {
        if (req.method === 'GET' || req.method === 'OPTIONS') return
        const catatan = { method: req.method, url: req.url, status: null }
        daftar.push(catatan)
        const tiruan =
            balasan || (blokir ? { statusCode: 400, body: { success: false, message: 'Diblokir oleh tes Cypress' } } : null)
        if (tiruan) {
            catatan.status = tiruan.statusCode
            req.reply(tiruan)
        } else {
            req.continue((res) => {
                catatan.status = res.statusCode
            })
        }
    })
    return daftar
}

function barisTeks(doc) {
    return doc.body.innerText
        .split('\n')
        .map((baris) => baris.trim())
        .filter(Boolean)
}

// Simpan baris teks yang sudah tampil sebelum aksi, supaya pesan yang muncul
// sesudahnya bisa dibedakan dari teks statis (mis. petunjuk syarat kata sandi).
export function rekamTeksAwal() {
    return cy.document().then((doc) => new Set(barisTeks(doc)))
}

// Tunggu sampai muncul pesan baru yang cocok dengan pola. Sumber pesan: teks baru
// di halaman, window.alert, atau pesan validasi bawaan browser pada input.
export function harusMunculPesan(pola, teksAwal, alerts = [], timeout = 10000) {
    cy.document({ timeout }).should((doc) => {
        const baru = barisTeks(doc).filter((baris) => !teksAwal.has(baris))
        const validasi = [...doc.querySelectorAll('input')].map((el) => el.validationMessage).filter(Boolean)
        const pesan = [...baru, ...alerts, ...validasi].join(' | ')
        expect(pesan, 'pesan yang muncul').to.match(pola)
    })
}

// Semua teks yang bisa dibaca pengguna di halaman: isi halaman, placeholder,
// aria-label, dan title. Dipakai untuk cek istilah "kata sandi" (CY-REG-033).
export function teksTampil(doc) {
    const atribut = [...doc.querySelectorAll('[placeholder], [aria-label], [title]')].flatMap((el) =>
        ['placeholder', 'aria-label', 'title'].map((nama) => el.getAttribute(nama)).filter(Boolean),
    )
    return [doc.body.innerText, ...atribut].join('\n')
}