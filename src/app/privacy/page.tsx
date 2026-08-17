import type { Metadata } from "next";
import LegalLayout from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — XySpace Blog",
  description: "Bagaimana XySpace Blog mengumpulkan, menggunakan, dan melindungi data Anda.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    heading: "1. Pengantar",
    paragraphs: [
      "Kebijakan Privasi ini menjelaskan data apa saja yang diproses oleh XySpace Blog (\"kami\") saat Anda mengunjungi dan berinteraksi dengan Situs, bagaimana data digunakan, dan hak Anda atas data tersebut, sesuai Undang-Undang Pelindungan Data Pribadi (UU PDP) No. 27 Tahun 2022.",
    ],
  },
  {
    heading: "2. Data yang Kami Kumpulkan",
    paragraphs: [
      "Kami mengumpulkan data dalam tiga kelompok:",
    ],
    list: [
      "Data yang Anda kirim: nama dan isi komentar atau balasan, serta reaksi/like yang Anda berikan. Like dan reaksi dicatat tanpa identitas pribadi — satu per browser.",
      "Data akun admin/tim: jika Anda masuk sebagai pemilik atau kolaborator, kami menyimpan email dan nama profil dari akun Google Anda untuk menampilkan badge XyDev/XyTeam pada balasan.",
      "Data teknis: alamat IP dan user-agent dari log server (dipakai untuk keamanan dan pembatasan laju permintaan), serta token sesi login yang tersimpan di browser Anda.",
    ],
  },
  {
    heading: "3. Cara Data Digunakan",
    paragraphs: [
      "Data digunakan untuk: menampilkan komentar dan interaksi publik, memoderasi konten, menjaga keamanan Situs (mencegah spam dan penyalahgunaan), serta memperbaiki dan mengembangkan layanan.",
      "Kami tidak menjual data Anda kepada pihak mana pun. Kami tidak menampilkan iklan bertarget berdasarkan data pribadi.",
    ],
  },
  {
    heading: "4. Penyimpanan dan Keamanan",
    paragraphs: [
      "Data disimpan di infrastruktur Supabase dengan enkripsi saat transit (TLS). Akses tulis hanya dilakukan dari sisi server dengan kredensial berprivilege yang tidak pernah terekspos ke browser. Media di Cloudinary disimpan dengan enkripsi at-rest oleh penyedia dan disajikan dalam versi teroptimasi (kompresi otomatis dan format WebP/AVIF).",
      "Komentar dan balasan disimpan selama Situs aktif. Anda dapat meminta penghapusan data Anda kapan saja melalui kontak di halaman About.",
    ],
  },
  {
    heading: "5. Pihak Ketiga (Pemroses Data)",
    paragraphs: [
      "Beberapa pemroses data terlibat dalam operasional Situs:",
    ],
    list: [
      "Vercel — hosting aplikasi dan log infrastruktur.",
      "Supabase — database, autentikasi Google, dan penyimpanan komentar/like.",
      "Cloudinary — penyimpanan dan pengiriman media (gambar/video).",
      "Google — autentikasi login pemilik/tim.",
      "OpenAI — opsional, hanya untuk menghasilkan draf copy saat fitur draft_copy digunakan.",
    ],
  },
  {
    heading: "6. Hak Anda",
    paragraphs: [
      "Sesuai UU PDP, Anda berhak atas akses, perbaikan, dan penghapusan data pribadi yang kami simpan, serta hak untuk mengajukan pengaduan ke lembaga pengawas. Untuk menggunakan hak tersebut, hubungi kami melalui halaman About.",
    ],
  },
  {
    heading: "7. Perubahan Kebijakan",
    paragraphs: [
      "Kebijakan ini dapat diperbarui sesuai kebutuhan layanan atau perubahan regulasi. Versi terbaru selalu tersedia di halaman ini dengan tanggal pembaruan.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Kebijakan Privasi"
      lead="Transparansi soal data yang kami proses dan hak Anda atasnya."
      updated="17 Agustus 2026"
      sections={sections}
    />
  );
}
