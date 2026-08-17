import type { Metadata } from "next";
import LegalLayout from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — XySpace Blog",
  description: "Syarat dan ketentuan penggunaan XySpace Blog, catatan publik proses membangun produk.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    heading: "1. Penerimaan Syarat",
    paragraphs: [
      "Dengan mengakses atau menggunakan XySpace Blog (\"Situs\"), Anda dianggap telah membaca, memahami, dan menyetujui seluruh isi Syarat & Ketentuan ini. Jika Anda tidak setuju dengan sebagian atau seluruh isinya, mohon berhenti menggunakan Situs.",
    ],
  },
  {
    heading: "2. Deskripsi Layanan",
    paragraphs: [
      "XySpace Blog adalah catatan publik (build-in-public) tentang aplikasi, eksperimen, dan produk yang sedang dikembangkan oleh XySpace. Konten yang ditampilkan mencerminkan kondisi pengembangan pada saat tertentu dan dapat berubah sewaktu-waktu tanpa pemberitahuan.",
    ],
  },
  {
    heading: "3. Konten Pengguna (Komentar, Balasan, dan Reaksi)",
    paragraphs: [
      "Anda dapat menulis komentar, balasan, dan memberikan reaksi pada halaman publik. Dengan mengirimkan konten, Anda menyatakan bahwa: konten tersebut bukan milik orang lain, tidak melanggar hukum (termasuk namun tidak terbatas pada pencemaran nama baik, ujaran kebencian, spam, atau konten melanggar hak cipta), dan tidak mengandung tautan berbahaya.",
      "Komentar tampil langsung setelah dikirim — tidak ada persetujuan manual. XySpace menerapkan penyaringan otomatis (spam dan kata terlarang) serta pembatasan laju permintaan, dan owner berhak menyembunyikan konten yang melanggar ketentuan tanpa pemberitahuan. Dengan mengirimkan komentar, Anda memberikan lisensi non-eksklusif kepada XySpace untuk menyimpan, menampilkan, dan mengelola konten tersebut di dalam Situs.",
    ],
  },
  {
    heading: "4. Akun Admin dan Tim",
    paragraphs: [
      "Akses control room hanya untuk pemilik (badge XyDev) dan kolaborator yang terdaftar (badge XyTeam). Login dilakukan melalui akun Google resmi yang terdaftar. Anda bertanggung jawab menjaga kerahasiaan sesi login Anda dan segera melaporkan akses yang tidak sah.",
    ],
  },
  {
    heading: "5. Hak Kekayaan Intelektual",
    paragraphs: [
      "Seluruh konten yang dibuat oleh XySpace — termasuk teks, desain, ilustrasi, logo, dan materi visual di Situs — dilindungi hak kekayaan intelektual yang sah. Anda tidak boleh menyalin, mendistribusikan, atau menggunakan ulang materi tersebut untuk keperluan komersial tanpa izin tertulis.",
    ],
  },
  {
    heading: "6. Layanan Pihak Ketiga",
    paragraphs: [
      "Situs berjalan di atas layanan pihak ketiga: Vercel (hosting), Supabase (database dan autentikasi), Cloudinary (penyimpanan media), Google (login), dan layanan AI opsional untuk pembuatan draf. Masing-masing layanan memiliki syarat dan kebijakan privasinya sendiri yang berlaku terhadap data yang diprosesnya.",
    ],
  },
  {
    heading: "7. Batasan Tanggung Jawab",
    paragraphs: [
      "Situs disediakan \"sebagaimana adanya\" (as is). XySpace tidak menjamin ketersediaan tanpa gangguan atau bebas dari kesalahan. Sejauh diizinkan hukum yang berlaku, XySpace tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan Situs, termasuk keputusan yang Anda ambil berdasarkan konten di dalamnya.",
    ],
  },
  {
    heading: "8. Perubahan Syarat",
    paragraphs: [
      "Syarat & Ketentuan ini dapat diperbarui dari waktu ke waktu. Versi terbaru selalu tersedia di halaman ini dengan tanggal pembaruan. Penggunaan Situs setelah pembaruan dianggap sebagai penerimaan terhadap perubahan tersebut.",
    ],
  },
  {
    heading: "9. Hukum yang Berlaku",
    paragraphs: [
      "Situs dikelola dari Indonesia. Ketentuan ini diatur oleh hukum Republik Indonesia, termasuk Undang-Undang Informasi dan Transaksi Elektronik (UU ITE) dan Undang-Undang Pelindungan Data Pribadi (UU PDP) beserta peraturan pelaksanaannya.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Syarat & Ketentuan"
      lead="Aturan penggunaan XySpace Blog sebagai catatan publik proses membangun produk."
      updated="17 Agustus 2026"
      sections={sections}
    />
  );
}
