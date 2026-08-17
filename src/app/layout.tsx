import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://progress-pulse-phi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "XySpace Blog — Building in public", template: "%s — XySpace Blog" },
  description: "Catatan progres aplikasi, eksperimen, dan produk yang sedang dibangun di XySpace.",
  applicationName: "XySpace Blog",
  keywords: ["XySpace", "build in public", "app progress", "product development", "blog teknologi"],
  authors: [{ name: "XySpace" }],
  creator: "XySpace",
  publisher: "XySpace",
  alternates: { canonical: "/" },
  icons: { icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }, { url: "/favicon.ico", type: "image/x-icon" }], shortcut: "/favicon.ico", apple: "/icon.png" },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "XySpace Blog",
    title: "XySpace Blog — Building in public",
    description: "Catatan progres aplikasi, eksperimen, dan produk yang sedang dibangun di XySpace.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "XySpace Blog — Building in public" }],
  },
  twitter: { card: "summary_large_image", title: "XySpace Blog — Building in public", description: "Catatan progres aplikasi dan produk yang sedang dibangun di XySpace.", images: ["/opengraph-image"] },
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0A090E" }, { media: "(prefers-color-scheme: light)", color: "#F3F1F7" }], colorScheme: "dark light", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}
