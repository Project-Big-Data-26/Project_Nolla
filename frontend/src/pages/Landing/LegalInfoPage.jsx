import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import nollaMain from "../../assets/nolla_main.webp";

const legalDocuments = {
  terms: {
    eyebrow: "INFORMASI NOLLA",
    title: "Terms and Conditions",
    description:
      "Ketentuan penggunaan NOLLA Skill Drill Matematika untuk membantu pengalaman belajar yang aman dan bertanggung jawab.",
    icon: FileText,
    sections: [
      {
        title: "1. Penerimaan ketentuan",
        paragraphs: [
          "Dengan membuat akun atau menggunakan NOLLA, pengguna menyetujui ketentuan ini. Jika tidak menyetujuinya, pengguna dapat berhenti menggunakan layanan.",
        ],
      },
      {
        title: "2. Layanan NOLLA",
        paragraphs: [
          "NOLLA menyediakan latihan matematika berbasis skill drill untuk jenjang SD hingga SMA, termasuk materi, soal, penilaian, dan ringkasan progres belajar. Konten dan fitur dapat diperbarui agar layanan tetap berjalan dan berkembang.",
          "NOLLA merupakan sarana latihan belajar. Hasil belajar tetap bergantung pada penggunaan dan usaha masing-masing siswa; NOLLA tidak menjanjikan nilai atau hasil akademik tertentu.",
        ],
      },
      {
        title: "3. Akun pengguna",
        paragraphs: [
          "Pengguna wajib memberikan informasi akun yang benar dan menjaga kerahasiaan kata sandi serta akses ke akunnya. Aktivitas yang dilakukan menggunakan akun menjadi tanggung jawab pengguna, kecuali jika terjadi akses tanpa izin yang telah dilaporkan kepada NOLLA.",
          "Akun tidak boleh digunakan untuk menyamar sebagai orang lain, mengganggu layanan, mencoba mengakses akun atau sistem tanpa izin, atau melakukan tindakan yang melanggar hukum.",
        ],
      },
      {
        title: "4. Materi dan hak kekayaan intelektual",
        paragraphs: [
          "Materi, desain, merek, dan komponen NOLLA dimiliki NOLLA atau digunakan dengan izin pemiliknya. Pengguna boleh mengaksesnya untuk keperluan belajar pribadi. Materi tidak boleh disalin, dijual, atau disebarkan kembali untuk tujuan komersial tanpa izin tertulis.",
        ],
      },
      {
        title: "5. Komunikasi dan perubahan layanan",
        paragraphs: [
          "NOLLA dapat mengirim pemberitahuan yang berkaitan dengan akun, keamanan, atau perubahan layanan melalui kanal kontak akun. NOLLA dapat memperbarui fitur maupun ketentuan ini; versi terbaru akan ditampilkan pada halaman ini beserta tanggal pembaruannya.",
        ],
      },
      {
        title: "6. Ketersediaan layanan",
        paragraphs: [
          "NOLLA berupaya menjaga layanan dan informasi tetap tersedia serta akurat, tetapi gangguan teknis, pemeliharaan, atau faktor di luar kendali NOLLA dapat menyebabkan layanan tidak tersedia sementara. Pengguna dapat menghubungi NOLLA jika menemukan masalah.",
        ],
      },
      {
        title: "7. Hukum yang berlaku dan pertanyaan",
        paragraphs: [
          "Ketentuan ini ditafsirkan berdasarkan hukum yang berlaku di Republik Indonesia. Pertanyaan mengenai ketentuan ini dapat disampaikan melalui kontak NOLLA yang tercantum di bagian bawah halaman.",
        ],
      },
    ],
  },
  privacy: {
    eyebrow: "INFORMASI NOLLA",
    title: "Privacy Policy",
    description:
      "Penjelasan ringkas mengenai data yang diproses NOLLA dan penggunaannya untuk menyediakan layanan belajar.",
    icon: ShieldCheck,
    sections: [
      {
        title: "1. Data yang diproses",
        paragraphs: [
          "Untuk menjalankan akun dan layanan belajar, NOLLA memproses nama, alamat email, jenjang belajar, dan pilihan avatar. Jika pengguna masuk dengan Google, informasi akun yang diperlukan untuk autentikasi juga diproses.",
          "NOLLA juga memproses aktivitas belajar seperti topik yang dibuka, jawaban, skor, dan durasi pengerjaan. Saat pengguna yang sudah masuk memakai aplikasi, data teknis aktivitas seperti nama peristiwa, waktu, serta ID sesi dan halaman dapat dicatat untuk mengoperasikan dan meningkatkan layanan.",
        ],
      },
      {
        title: "2. Tujuan penggunaan data",
        paragraphs: [
          "Data digunakan untuk membuat dan mengamankan akun, menampilkan materi dan hasil belajar, menyimpan progres, membantu personalisasi latihan, menangani kendala, serta memahami kinerja layanan. Data pribadi tidak dijual.",
        ],
      },
      {
        title: "3. Penyimpanan dan pengungkapan",
        paragraphs: [
          "Data disimpan pada sistem yang digunakan untuk menjalankan NOLLA. Akses dibatasi sesuai kebutuhan operasional. Data hanya dibagikan kepada penyedia yang diperlukan untuk menjalankan layanan atau apabila diwajibkan oleh hukum.",
          "NOLLA menerapkan langkah perlindungan yang wajar untuk menjaga data dari akses atau penggunaan tanpa izin. Tidak ada sistem elektronik yang dapat dijamin bebas sepenuhnya dari risiko keamanan.",
        ],
      },
      {
        title: "4. Masa penyimpanan dan hak pengguna",
        paragraphs: [
          "Data disimpan selama diperlukan untuk menyediakan layanan, mengelola akun, memenuhi kewajiban hukum, dan menangani keamanan. Pengguna dapat meminta akses, koreksi, atau penghapusan data dengan menghubungi NOLLA. Permintaan akan ditangani sesuai ketentuan yang berlaku.",
        ],
      },
      {
        title: "5. Pengguna anak dan pendampingan",
        paragraphs: [
          "NOLLA ditujukan untuk kegiatan belajar siswa. Orang tua atau wali dianjurkan mendampingi anak saat membuat akun dan menggunakan layanan, serta membantu menyampaikan permintaan terkait data pribadi anak.",
        ],
      },
      {
        title: "6. Perubahan dan kontak",
        paragraphs: [
          "Kebijakan ini dapat diperbarui mengikuti perubahan layanan atau kewajiban yang berlaku. Tanggal pembaruan terakhir ditampilkan di bawah. Untuk pertanyaan atau permintaan terkait data pribadi, hubungi NOLLA melalui kontak yang tercantum pada halaman ini.",
        ],
      },
    ],
  },
};

const LegalInfoPage = ({ documentType = "terms" }) => {
  const document = legalDocuments[documentType] || legalDocuments.terms;
  const Icon = document.icon;
  const otherPath =
    documentType === "terms" ? "/privacy-policy" : "/terms-and-conditions";
  const otherLabel =
    documentType === "terms" ? "Privacy Policy" : "Terms and Conditions";

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-['Poppins',sans-serif] text-[#1b1f3b]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img
              src={nollaMain}
              alt=""
              aria-hidden="true"
              className="h-8 w-auto object-contain"
            />
            <span className="font-heading text-lg font-semibold">NOLLA</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 sm:text-sm"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 sm:mb-8 sm:p-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-blue-600">
            {document.eyebrow}
          </p>
          <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {document.title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            {document.description}
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Terakhir diperbarui: 3 November 2026
          </p>
        </div>

        <div className="space-y-4">
          {document.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <h2 className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">
                {section.title}
              </h2>
              <div className="space-y-3 text-[13px] leading-7 text-slate-600 sm:text-sm">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
            Baca juga informasi NOLLA lainnya.
          </p>
          <Link
            to={otherPath}
            aria-label={`Buka ${otherLabel}`}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:text-sm"
          >
            {otherLabel}
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        © 2026 NOLLA. Hak cipta dilindungi.
      </footer>
    </div>
  );
};

export default LegalInfoPage;
