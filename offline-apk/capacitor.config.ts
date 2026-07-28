import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.quranlearning.offline",
  appName: "Iqra",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
