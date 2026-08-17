import type { Metadata } from "next";
import LegalLayout from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Kebijakan Cookie",
  description: "Cookie dan penyimpanan lokal yang digunakan oleh XySpace Blog.",
  alternates: { canonical: "/cookies" },
};

const sections = [
  {
    heading: "1. Apa Itu Cookie",
    paragraphs: [
      "Cookie adalah file kecil yang disimpan browser Anda oleh situs web. Situs ini juga menggunakan penyimpanan lokal (localStorage) untuk menyimpan preferensi di sisi browser Anda.",
    ],
  },
  {
    heading: "2. Cookie dan Penyimpanan yang Kami Gunakan",
    paragraphs: [
      "XySpace Blog tidak menggunakan cookie iklan atau pelacakan pihak ketiga. Yang digunakan hanya untuk fungsi dasar:",
    ],
    list: [
      "Sesi login Supabase (localStorage) — hanya aktif saat Anda masuk sebagai pemilik/tim di halaman admin.",
      "pulse-theme (localStorage) — menyimpan pilihan tema gelap/terang.",
      "xyspace-visitor-id (localStorage) — identifier acak untuk deduplikasi like/reaksi dan perlindungan anti-spam; tidak berisi nama atau email.",
      "pp-liked dan pp-reacted (localStorage) — menyimpan status interaksi agar antarmuka tidak menawarkan aksi yang sama berulang kali.",
    ],
  },
  {
    heading: "3. Cookie Pihak Ketiga",
    paragraphs: [
      "Saat Anda berinteraksi dengan layanan eksternal, pihak tersebut dapat memproses data teknisnya sendiri: Google saat login, Cloudinary saat memuat media, Cloudflare Turnstile saat verifikasi anti-bot, dan Vercel sebagai infrastruktur hosting. Silakan merujuk pada kebijakan masing-masing layanan.",
    ],
  },
  {
    heading: "4. Mengelola Cookie",
    paragraphs: [
      "Anda dapat menghapus atau memblokir cookie melalui pengaturan browser Anda. Perhatikan bahwa memblokir penyimpanan lokal dapat membuat preferensi tema atau status like/reaksi tidak tersimpan. Situs tetap dapat diakses secara normal tanpa fitur-fitur tersebut.",
    ],
  },
  {
    heading: "5. Perubahan Kebijakan",
    paragraphs: [
      "Kebijakan ini dapat diperbarui seiring perubahan penggunaan penyimpanan di Situs. Versi terbaru selalu tersedia di halaman ini.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Kebijakan Cookie"
      lead="Cookie dan penyimpanan lokal yang dipakai Situs, serta cara mengelolanya."
      updated="17 Agustus 2026"
      sections={sections}
    />
  );
}
