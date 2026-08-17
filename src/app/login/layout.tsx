import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Akses aman untuk pemilik dan tim XySpace.",
  robots: { index: false, follow: false, noarchive: true },
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
