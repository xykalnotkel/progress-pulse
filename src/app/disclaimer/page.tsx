import type { Metadata } from "next";
import LegalLayout from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Penjelasan batasan tanggung jawab konten di XySpace Blog.",
  alternates: { canonical: "/disclaimer" },
};

const sections = [
  {
    heading: "1. Konten Informatif",
    paragraphs: [
      "Seluruh konten di XySpace Blog — termasuk catatan progres, tulisan, dan ilustrasi — bersifat informatif dan dokumentasi proses pembangunan. Konten bukan nasihat profesional (keuangan, hukum, medis, atau lainnya) dan tidak boleh dijadikan dasar keputusan tanpa verifikasi mandiri.",
    ],
  },
  {
    heading: "2. Produk Dalam Pengembangan",
    paragraphs: [
      "Aplikasi dan produk yang dibahas sedang dalam tahap pengembangan. Fitur, antarmuka, dan jadwal dapat berubah sewaktu-waktu tanpa pemberitahuan. Informasi yang tampil mungkin tertinggal dari kondisi aktual.",
    ],
  },
  {
    heading: "3. Konten Pengguna",
    paragraphs: [
      "Komentar, balasan, dan reaksi dari pengunjung merupakan opini penulisnya masing-masing dan tidak mencerminkan pandangan XySpace. Meski melewati moderasi, XySpace tidak bertanggung jawab atas isi konten yang dikirim pengguna.",
    ],
  },
  {
    heading: "4. Tautan Eksternal",
    paragraphs: [
      "Situs dapat memuat tautan ke situs atau aplikasi eksternal. XySpace tidak bertanggung jawab atas ketersediaan, keamanan, atau isi situs eksternal tersebut.",
    ],
  },
  {
    heading: "5. Ketersediaan Layanan",
    paragraphs: [
      "Situs dapat mengalami gangguan sementara untuk pemeliharaan atau faktor di luar kendali kami. Kami berusaha menjaga ketersediaan namun tidak menjamin akses tanpa interupsi.",
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="Disclaimer"
      lead="Batasan tanggung jawab atas konten dan layanan di Situs ini."
      updated="17 Agustus 2026"
      sections={sections}
    />
  );
}
