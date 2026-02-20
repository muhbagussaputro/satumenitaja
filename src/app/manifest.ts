import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SatuMenitAja",
    short_name: "SatuMenitAja",
    description:
      "Al-Quran web app mobile-first untuk baca, bookmark, dan lanjutkan dari terakhir.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f3e8",
    theme_color: "#2f4f3f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
