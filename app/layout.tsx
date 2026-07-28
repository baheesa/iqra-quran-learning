import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";

import { SkipLinkClient } from "@/features/i18n/SkipLinkClient";
import { UiLocaleProvider } from "@/features/i18n/locale-context";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { APP_NAME_ENGLISH, APP_NAME_URDU } from "@/lib/constants";

import "./globals.css";

const uiFont = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: `${APP_NAME_ENGLISH} | ${APP_NAME_URDU}`,
  description:
    "AI-assisted Quran learning based on Muallim-ul-Quran — recognition-first, reading-focused.",
  applicationName: APP_NAME_ENGLISH,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quran Learn",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e4a38" },
    { media: "(prefers-color-scheme: dark)", color: "#121a16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('quran.ui.theme');
    var mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    root.dataset.theme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={uiFont.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-ui antialiased">
        <ThemeProvider>
          <UiLocaleProvider>
            <SkipLinkClient />
            <div id="main-content">{children}</div>
          </UiLocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
