import { loginGoogle } from '../../support/google-login.js';
// Backend asli. Hanya CY-RESET-030 memakai stub respons error UI.
// OTP dimasukkan manual di enam kotak, lalu Resume di Cypress Open (bukan tombol Verifikasi).
// 017 memakai Google OAuth asli dengan cy.origin; 031 pending karena requirement belum ditetapkan.
// RESET_RUN_ALL=true menjalankan berurutan dengan cleanup akun uji sebelum setiap case OTP.
// OTP tetap diisi manual. Cleanup memerlukan URI/nama DB yang diisi pengguna.
const API = Cypress.env('RESET_API_URL') || 'http://localhost:5000/api';
const OTP_INPUT = 'input[inputmode="numeric"]';
const PWD = 'input[name="newPassword"]';
const CONFIRM = 'input[name="confirmPassword"]';
const VALID = 'Baru1234';
const POLICY = 'Password minimal 8 karakter dan harus memiliki huruf besar, huruf kecil, serta angka.';
const UNKNOWN = Cypress.env('RESET_UNREGISTERED_EMAIL') || 'nolla.reset.unregistered@example.com';
const SAFE_CASES = ['001', '002', '003', '012', '013', '032'];
let currentPassword;
let passwordBeforeReset;
let resetCompleted = false;
let activeCase;
const CLEANUP_CASES = ['004', '005', '006', '009', '010', '011', '015', '016',
  '017', '018', '020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', '033', '034'];

function required(key) {
  const value = Cypress.env(key);
  expect(value, `Isi ${key} di cypress.env.json`).to.be.a('string').and.not.be.empty;
  return value;
}
const email = () => required('AKUN04_EMAIL');
function test(id, title, callback, pending = false) {
  const chosen = String(Cypress.env('RESET_CASE') || '').split('+')
    .map(value => value.replace('CY-RESET-', '').padStart(3, '0'));
  const all = Cypress.env('RESET_RUN_ALL') === true;
  const cleanup = Cypress.env('RESET_DB_CLEANUP') === true;
  const manualCleanup = Cypress.env('RESET_MANUAL_CLEANUP') === true;
  if (cleanup && manualCleanup) throw new Error('Pilih cleanup manual ATAU otomatis. Untuk manual set RESET_DB_CLEANUP=false.');
  if (all && !cleanup && !manualCleanup) throw new Error('RESET_RUN_ALL memerlukan cleanup manual atau otomatis pada database testing.');
  if ((cleanup || manualCleanup) && Cypress.env('RESET_REUSE_OTP') === true) {
    throw new Error('Cleanup dan reuse OTP tidak bisa digabung. Set RESET_REUSE_OTP=false.');
  }
  const selected = Cypress.env('RESET_CASE') ? chosen.includes(id) : all || SAFE_CASES.includes(id);
  if (!cleanup && !manualCleanup && chosen.length > 1 && chosen.some(value => !SAFE_CASES.includes(value))) {
    throw new Error('Beberapa case OTP memerlukan cleanup testing; tanpa cleanup pilih satu case per run.');
  }
  const rateLimitPending = id === '034' && !all && Cypress.env('RESET_ALLOW_RATE_LIMIT_TEST') !== true;
  (pending || rateLimitPending || !selected ? it.skip : it)(`CY-RESET-${id}: ${title}`, () => {
    activeCase = id;
    if (manualCleanup && CLEANUP_CASES.includes(id)) {
      const key = id === '016' ? 'AKUN07_EMAIL' : id === '017' ? 'AKUN06_EMAIL' : 'AKUN04_EMAIL';
      const account = required(key);
      pause(`CLEANUP MANUAL sebelum ${id}: pada database testing, hapus otps untuk email ${account} dan type PASSWORD_RESET; hapus otpratelimits untuk email yang sama. Jangan hapus users/OTP registrasi. Setelah selesai klik Resume. Tidak ada penghapusan otomatis.`);
    }
    if (cleanup && CLEANUP_CASES.includes(id)) {
      const key = id === '016' ? 'AKUN07_EMAIL' : id === '017' ? 'AKUN06_EMAIL' : 'AKUN04_EMAIL';
      cy.task('recovery:cleanup', { email: required(key) }).then(result => {
        cy.log(`Cleanup: ${result.otpDeleted} OTP, ${result.rateLimitDeleted} rate limit akun uji.`);
      });
    }
    callback();
  });
}
function post(path, body) {
  return cy.request({ method: 'POST', url: `${API}/auth/${path}`, body,
    failOnStatusCode: false, log: false });
}
function successful(response) {
  expect(response.status, response.body?.message).to.be.within(200, 299);
  expect(response.body.status).to.eq('success');
}
function waitSuccess(alias) {
  return cy.wait(alias).then(({ response }) => {
    if (response.statusCode === 429) {
      throw new Error(`BLOCKED: server membatasi OTP. Tunggu ${response.body.retryAfterSeconds || '?'} detik lalu jalankan case ini saja. Tidak ada retry otomatis.`);
    }
    successful({ status: response.statusCode, body: response.body });
  });
}
function pause(message) {
  cy.then(() => {
    if (!Cypress.config('isInteractive')) {
      throw new Error('BLOCKED: input OTP manual membutuhkan npm.cmd run cy:open.');
    }
  });
  cy.log(message);
  return cy.pause();
}
function otpFor() {
  pause('Buka email TERBARU. Isi enam kotak OTP saja. Jangan klik Verifikasi. Klik Resume pada runner Cypress.');
  return cy.get('body', { log: false }).then($body => {
    const $inputs = $body.find(OTP_INPUT);
    const pathname = $body[0].ownerDocument.location.pathname;
    // The user may already have verified during pause. Only positive flows
    // allow this: negative OTP tests still need to enter the wrong code first.
    const selected = activeCase;
    if (pathname === '/reset' && ['005', '006'].includes(selected)) return null;
    if ($inputs.length !== 6) {
      throw new Error('Form OTP sudah tidak terbuka. Untuk case ini isi kode saja saat pause, lalu Resume tanpa klik Verifikasi.');
    }
    const otp = [...$inputs].map(input => input.value).join('');
    if (!/^\d{6}$/.test(otp)) throw new Error('Isi enam digit OTP pada halaman sebelum Resume.');
    return otp;
  });
}
function visitState(route, state) {
  cy.visit(route, { onBeforeLoad(win) {
    win.history.replaceState({ usr: state, key: 'recovery-test', idx: 0 }, '', route);
  } });
}
function openOtp(account = email()) {
  if (Cypress.env('RESET_REUSE_OTP') === true) {
    visitState('/verify', { email: account, action: 'reset-password', resendAfterSeconds: 0 });
    cy.log('Memakai OTP yang sudah ada. Tidak ada request kirim OTP. Kode harus belum kedaluwarsa dan belum dibatalkan resend.');
  } else {
    cy.visit('/forgot-password'); sendFromUi(account); waitSuccess('@sendOtp');
  }
  cy.location('pathname', { timeout: 10000 }).should('eq', '/verify');
  cy.contains('h1', 'Verifikasi Kode OTP').should('be.visible');
  return otpFor();
}
function verify(otp) {
  if (otp === null) return; // Already verified manually during pause.
  cy.get(OTP_INPUT).should('have.length', 6).each(($input, index) => {
    cy.wrap($input).clear().type(otp[index], { log: false });
  });
  cy.contains('button[type="submit"]', 'Verifikasi OTP').click();
}
function openReset(account = email()) {
  openOtp(account).then(verify); waitSuccess('@verifyOtp');
  cy.location('pathname', { timeout: 10000 }).should('eq', '/reset');
  return cy.contains('h1', 'Atur Ulang Kata Sandi').should('be.visible');
}
function fill(password, confirmation = password) {
  cy.get(PWD).clear().type(password, { log: false });
  cy.get(CONFIRM).clear().type(confirmation, { log: false });
}
function save() { cy.contains('button[type="submit"]', 'Simpan Kata Sandi Baru').click(); }
function saved(password) {
  waitSuccess('@savePassword');
  cy.contains('Kata Sandi Berhasil Diperbarui!').should('be.visible');
  return cy.location('pathname', { timeout: 10000 }).should('eq', '/login')
    .then(() => { currentPassword = password; });
}
function login(account, password) {
  cy.visit('/login');
  cy.get('input[name="email"]').type(account);
  cy.get('input[name="password"]').type(password, { log: false });
  cy.contains('button[type="submit"]', /^Masuk$/).click();
}
function sendFromUi(account) {
  cy.get('input[type="email"]').clear().type(account);
  if (account !== 'sevira@' && Cypress.env('RESET_DB_CLEANUP') !== true && Cypress.env('RESET_MANUAL_CLEANUP') !== true) {
    pause('Cypress akan meminta SATU OTP. Pastikan jeda sebelumnya selesai. Klik Resume; jangan klik Kirim sendiri.');
  }
  cy.contains('button[type="submit"]', 'Kirim Kode OTP').click();
}
function wrong(otp) { return otp === '000000' ? '111111' : '000000'; }
function remainsReset() {
  cy.get('@savePassword.all').should('have.length', 0);
  cy.location('pathname').should('eq', '/reset');
}

describe('Memulihkan kata sandi - CY-RESET-001 sampai 034', { retries: 0 }, () => {
  beforeEach(() => {
    ['forgot-password', 'verify-reset-otp', 'send-otp', 'change-password', 'login']
      .forEach((path, index) => {
        cy.intercept('POST', `**/auth/${path}`)
          .as(['sendOtp', 'verifyOtp', 'resendOtp', 'savePassword', 'login'][index]);
      });
  });
  test('001', 'membuka halaman dari Login', () => {
    cy.visit('/login'); cy.contains('a', 'Lupa Kata Sandi').click();
    cy.location('pathname').should('eq', '/forgot-password');
    cy.contains('h1', 'Lupa Kata Sandi').should('be.visible');
  });
  test('002', 'elemen utama lengkap', () => {
    cy.visit('/forgot-password');
    cy.get('input[type="email"]').should('be.visible').and('be.enabled');
    cy.contains('button[type="submit"]', 'Kirim Kode OTP').should('be.visible').and('be.enabled');
    cy.contains('a', 'Kembali ke Login').should('be.visible').and('have.attr', 'href', '/login');
  });
  test('003', 'batal tanpa mengirim OTP', () => {
    cy.visit('/forgot-password'); cy.get('input[type="email"]').type('reset.test@example.com');
    cy.contains('a', 'Kembali ke Login').click();
    cy.location('pathname').should('eq', '/login');
    cy.get('@sendOtp.all').should('have.length', 0);
  });
  test('004', 'email terdaftar membuka form OTP', () => {
    cy.visit('/forgot-password'); sendFromUi(email()); waitSuccess('@sendOtp');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/verify');
    cy.get(OTP_INPUT).should('have.length', 6);
  });
  test('005', 'OTP benar membuka form kata sandi', () => {
    openOtp().then(verify); waitSuccess('@verifyOtp');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/reset');
    cy.get(PWD).should('be.visible'); cy.get(CONFIRM).should('be.visible');
  });
  test('006', 'alur lengkap sampai Login', () => {
    const password = Cypress.env('RESET_NEW_PASSWORD') || VALID;
    passwordBeforeReset = required('AKUN04_PASSWORD');
    expect(password, 'Password baru harus berbeda dari password awal agar 008 bermakna').not.to.eq(passwordBeforeReset);
    post('login', { email: email(), password: passwordBeforeReset }).then(successful);
    if (Cypress.env('RESET_REUSE_OTP') === true) {
      cy.log('Lanjutan 004/005: memakai OTP lama, tanpa menguji pengiriman ulang pada run ini.');
      openOtp().then(verify);
    } else {
      cy.visit('/forgot-password'); sendFromUi(email()); waitSuccess('@sendOtp');
      cy.location('pathname', { timeout: 10000 }).should('eq', '/verify');
      otpFor().then(verify);
    }
    waitSuccess('@verifyOtp');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/reset');
    fill(password); save(); saved(password).then(() => { resetCompleted = true; });
  });
  test('007', 'login kata sandi baru berhasil', () => {
    // Precondition: 006 already succeeded. Do not request OTP or reset again.
    login(email(), currentPassword || Cypress.env('RESET_CURRENT_PASSWORD') || Cypress.env('RESET_NEW_PASSWORD') || VALID);
    waitSuccess('@login');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/topik');
  });
  test('008', 'kata sandi lama ditolak setelah reset', () => {
    if (Cypress.env('RESET_RUN_ALL') === true && !resetCompleted) {
      throw new Error('BLOCKED: 006 belum berhasil menyimpan password; 008 membutuhkan reset berhasil.');
    }
    const oldPassword = passwordBeforeReset || required('RESET_OLD_PASSWORD');
    const newPassword = currentPassword || Cypress.env('RESET_CURRENT_PASSWORD') || Cypress.env('RESET_NEW_PASSWORD') || VALID;
    expect(newPassword, 'Password baru dan lama harus berbeda').not.to.eq(oldPassword);
    post('login', { email: email(), password: newPassword }).then(successful);
    login(email(), oldPassword);
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.location('pathname').should('eq', '/login');
  });
  test('009', 'kata sandi tersembunyi secara default', () => {
    openReset(); fill(VALID);
    [PWD, CONFIRM].forEach(selector => cy.get(selector).should('have.attr', 'type', 'password'));
  });
  test('010', 'tombol menampilkan kedua kata sandi', () => {
    openReset(); fill(VALID);
    [PWD, CONFIRM].forEach(selector => {
      cy.get(selector).parent().find('button[type="button"]').click();
      cy.get(selector).should('have.attr', 'type', 'text').and('have.value', VALID);
    });
  });
  test('011', 'tombol menyembunyikan kembali', () => {
    openReset(); fill(VALID);
    [PWD, CONFIRM].forEach(selector => {
      cy.get(selector).parent().find('button[type="button"]').click();
      cy.get(selector).should('have.attr', 'type', 'text');
      cy.get(selector).parent().find('button[type="button"]').click();
      cy.get(selector).should('have.attr', 'type', 'password').and('have.value', VALID);
    });
  });
  test('012', 'email kosong mencegah request', () => {
    cy.visit('/forgot-password'); cy.contains('button[type="submit"]', 'Kirim Kode OTP').click();
    cy.get('input[type="email"]').should($input => {
      expect($input[0].validity.valueMissing).to.eq(true);
      expect($input[0].validationMessage).not.to.eq('');
    });
    cy.get('@sendOtp.all').should('have.length', 0);
    cy.location('pathname').should('eq', '/forgot-password');
  });
  test('013', 'format email salah mencegah request', () => {
    cy.visit('/forgot-password'); sendFromUi('sevira@');
    cy.get('input[type="email"]').should($input => expect($input[0].validity.typeMismatch).to.eq(true));
    cy.get('@sendOtp.all').should('have.length', 0);
    cy.location('pathname').should('eq', '/forgot-password');
  });
  test('014', 'email tidak terdaftar menampilkan pesan UCS', () => {
    cy.visit('/forgot-password'); sendFromUi(UNKNOWN); cy.wait('@sendOtp');
    cy.contains('Email tidak ditemukan').should('be.visible');
    cy.location('pathname').should('eq', '/forgot-password');
  });
  test('015', 'email salah dapat dikoreksi', () => {
    cy.visit('/forgot-password'); sendFromUi(UNKNOWN); cy.wait('@sendOtp');
    cy.contains('Email tidak ditemukan').should('be.visible');
    sendFromUi(email()); waitSuccess('@sendOtp');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/verify');
  });
  test('016', 'Google tanpa password mendapat arahan Google dan Profil', () => {
    const account = required('AKUN07_EMAIL');
    cy.visit('/forgot-password'); sendFromUi(account);
    cy.wait('@sendOtp').its('response.statusCode').should('be.within', 400, 499);
    cy.contains(/Google/).should('be.visible'); cy.contains(/Profil/).should('be.visible');
    cy.location('pathname').should('eq', '/forgot-password');
    // Absence of actual email/OTP creation is checked separately; UI only here.
  });
  test('017', 'AKUN-06 reset, login email dan Login Google ke akun yang sama', () => {
    const account = required('AKUN06_EMAIL');
    // Password akun Google/Gmail, BUKAN password NOLLA yang dibuat lewat Profil.
    const googlePassword = required('AKUN06_GOOGLE_PASSWORD');
    let expectedId;
    openReset(account); fill(VALID); save(); waitSuccess('@savePassword');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
    login(account, VALID);
    cy.wait('@login').then(({ response }) => {
      successful({ status: response.statusCode, body: response.body });
      const user = response.body.data.user;
      expect(user.email.toLowerCase()).to.eq(account.toLowerCase());
      expectedId = String(user.id || user._id || '');
      expect(expectedId, 'ID akun NOLLA dari login email').not.to.eq('');
    });
    cy.location('pathname', { timeout: 10000 }).should('eq', '/topik');
    cy.intercept('POST', '**/auth/logout').as('googleCaseLogout');
    cy.get('button[title="Keluar"]').should('be.visible').click();
    cy.get('[role="alertdialog"]').contains('button', /^Ya, Keluar$/).click();
    waitSuccess('@googleCaseLogout');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
    cy.window({ log: false }).should(win => {
      expect(win.localStorage.getItem('accessToken')).to.eq(null);
      expect(win.localStorage.getItem('user')).to.eq(null);
    });
    cy.intercept('GET', '**/auth/me').as('googleMe');
    loginGoogle(account, googlePassword);
    cy.wait('@googleMe', { timeout: 60000 }).then(({ response }) => {
      successful({ status: response.statusCode, body: response.body });
      const user = response.body.data.user;
      expect(user.email.toLowerCase(), 'Email akun setelah Login Google').to.eq(account.toLowerCase());
      expect(String(user.id || user._id), 'ID NOLLA tetap sama setelah Login Google').to.eq(expectedId);
    });
    cy.location('pathname', { timeout: 30000 }).should('eq', '/topik');
  });
  test('018', 'OTP salah tidak membuka reset', () => {
    openOtp().then(otp => verify(wrong(otp)));
    cy.wait('@verifyOtp').its('response.statusCode').should('eq', 400);
    cy.contains(/Kode OTP salah/).should('be.visible');
    cy.location('pathname').should('eq', '/verify'); cy.get(PWD).should('not.exist');
  });
  test('019', 'OTP kosong tidak dikirim', () => {
    visitState('/verify', { email: email(), action: 'reset-password' });
    cy.contains('button[type="submit"]', 'Verifikasi OTP').click();
    cy.contains('Harap masukkan 6 digit kode OTP secara lengkap!').should('be.visible');
    cy.get('@verifyOtp.all').should('have.length', 0);
    cy.location('pathname').should('eq', '/verify');
  });
  function resend() {
    // Prasyarat: cooldown server sudah berakhir; tidak memakai fake clock.
    openOtp();
    if (Cypress.env('RESET_DB_CLEANUP') !== true && Cypress.env('RESET_MANUAL_CLEANUP') !== true) {
      pause('Tunggu tombol Kirim ulang OTP aktif dan jeda server selesai. Jangan klik tombolnya sendiri. Klik Resume untuk SATU resend.');
    }
    cy.contains('button', /^Kirim ulang OTP$/).should('be.enabled').click();
    cy.wait('@resendOtp').then(({ request, response }) => {
      expect(request.body.type).to.eq('PASSWORD_RESET');
      if (response.statusCode === 429) throw new Error(`BLOCKED: cooldown resend ${response.body.retryAfterSeconds}s; tunggu sebelum rerun.`);
      successful({ status: response.statusCode, body: response.body });
    });
  }
  test('020', 'kirim ulang menghasilkan OTP', () => {
    resend(); cy.contains('OTP baru telah dikirim ke email Anda.').should('be.visible');
    cy.location('pathname').should('eq', '/verify');
  });
  test('021', 'OTP terbaru dapat diverifikasi', () => {
    resend(); otpFor(email()).then(verify); waitSuccess('@verifyOtp');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/reset');
  });
  test('022', 'kata sandi tujuh karakter ditolak', () => {
    openReset(); fill('Baru123'); save();
    cy.get(PWD).should('have.value', 'Baru123');
    cy.get(CONFIRM).should('have.value', 'Baru123');
    cy.get('body').should($body => {
      const input = $body.find(PWD)[0];
      const nativeMessage = input.validity.tooShort && Boolean(input.validationMessage);
      const applicationMessage = $body.find('span').filter((_, node) =>
        node.textContent.trim() === POLICY).filter(':visible').length > 0;
      expect(nativeMessage || applicationMessage, 'Pesan penolakan kata sandi kurang dari 8 karakter tampil').to.eq(true);
    });
    remainsReset(); // No save request, and the reset form stays open.
  });
  [['023', 'tanpa huruf besar', 'baru1234'], ['024', 'tanpa huruf kecil', 'BARU1234'],
    ['025', 'tanpa angka', 'BaruBaru']].forEach(([id, title, password]) => {
    test(id, `${title} ditolak`, () => {
      openReset(); fill(password); save(); cy.contains(POLICY).should('be.visible'); remainsReset();
    });
  });
  test('026', 'tepat delapan karakter diterima', () => {
    expect(VALID).to.have.length(8); openReset(); fill(VALID); save(); saved(VALID);
  });
  test('027', 'konfirmasi berbeda ditolak', () => {
    openReset(); fill(VALID, 'Baru12345'); save();
    cy.contains('Konfirmasi kata sandi baru tidak cocok!').should('be.visible'); remainsReset();
  });
  test('028', 'kedua field kosong ditolak', () => {
    openReset(); save();
    [PWD, CONFIRM].forEach(selector => {
      cy.get(selector).should($input => expect($input[0].validity.valueMissing).to.eq(true));
    }); remainsReset();
  });
  test('029', 'kata sandi invalid dapat dikoreksi', () => {
    openReset(); fill('baru1234'); save(); cy.contains(POLICY).should('be.visible'); remainsReset();
    fill(VALID); save(); saved(VALID);
  });
  test('030', 'UI menangani simpan 500 (stub)', () => {
    openReset();
    cy.intercept('POST', '**/auth/change-password', { statusCode: 500,
      body: { status: 'error', message: 'Terjadi kesalahan pada server' } }).as('saveError');
    fill(VALID); save(); cy.wait('@saveError').its('response.statusCode').should('eq', 500);
    cy.contains('Terjadi kesalahan pada server').should('be.visible');
    cy.location('pathname').should('eq', '/reset'); cy.get(PWD).should('be.visible');
  });
  test('031', 'PENDING: perilaku sesi sudah login belum ditetapkan', () => {
    // Aktifkan setelah aturan akses/redirect disepakati dan Expected Result ditetapkan.
    // Precondition belum login tidak menetapkan hasil untuk sesi yang sudah login.
  }, true);
  test('032', 'akses langsung reset tanpa OTP ditolak', () => {
    cy.visit('/reset'); cy.contains('h2', 'Akses Ditolak').should('be.visible');
    cy.contains('Silakan verifikasi kode OTP').should('be.visible');
    cy.get(PWD).should('not.exist'); cy.get('button[type="submit"]').should('not.exist');
    cy.get('@savePassword.all').should('have.length', 0);
    cy.contains('button', 'Ke Halaman Lupa Kata Sandi').click();
    cy.location('pathname').should('eq', '/forgot-password');
  });
  test('033', 'OTP benar berhasil setelah OTP salah', () => {
    openOtp().then(otp => {
      verify(wrong(otp)); cy.wait('@verifyOtp').its('response.statusCode').should('eq', 400);
      cy.contains(/Kode OTP salah/).should('be.visible'); verify(otp);
    }); waitSuccess('@verifyOtp');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/reset');
  });
  test('034', 'pesan pembatasan OTP sesuai UCS', () => {
    pause('Case ini SENGAJA menguji rate limit. Resume hanya jika siap; jalankan paling akhir.');
    function reachLimit(remaining = 4) {
      return post('forgot-password', { email: email() }).then(response => {
        if (response.status === 429) return;
        successful(response);
        if (remaining <= 1) throw new Error('Rate limit belum tercapai; konfirmasi ambang server.');
        return reachLimit(remaining - 1);
      });
    }
    reachLimit(); cy.visit('/forgot-password'); sendFromUi(email());
    cy.wait('@sendOtp').its('response.statusCode').should('eq', 429);
    cy.contains('span', 'Terlalu banyak permintaan OTP. Coba lagi nanti.').should('be.visible');
    cy.location('pathname').should('eq', '/forgot-password');
    cy.get('button[type="submit"]').should('be.disabled');
  });
});
