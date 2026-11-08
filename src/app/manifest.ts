import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HORIZON",
    short_name: "HORIZON",
    description: "Independent AI models. Chat, subscribe, benchmark.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d12",
    theme_color: "#3b63d6",
    icons: [
      { src: "/brand/horizon-mark-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/horizon-mark-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
