import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "XySpace Blog", short_name: "XySpace", description: "Catatan progres aplikasi dan produk dari XySpace.", start_url: "/", display: "standalone", background_color: "#0A090E", theme_color: "#7B43D8", icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }] };
}
