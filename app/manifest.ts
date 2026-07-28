import type { MetadataRoute } from "next";

import { APP_NAME_ENGLISH } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME_ENGLISH,
    short_name: "Quran Learn",
    description:
      "Muallim-ul-Quran based learning — read, recognize, understand.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f6f2",
    theme_color: "#1e4a38",
    orientation: "portrait-primary",
    lang: "en",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
