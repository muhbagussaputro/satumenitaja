import type { Metadata } from "next";
import {
  Amiri,
  Cairo,
  Markazi_Text,
  Noto_Kufi_Arabic,
  Noto_Naskh_Arabic,
  Noto_Sans_Arabic,
  Plus_Jakarta_Sans,
  Scheherazade_New,
  Tajawal,
} from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PreferencesProvider } from "@/components/preferences-provider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic-naskh",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const amiri = Amiri({
  variable: "--font-arabic-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const scheherazadeNew = Scheherazade_New({
  variable: "--font-arabic-scheherazade",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const markaziText = Markazi_Text({
  variable: "--font-arabic-markazi",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-arabic-kufi",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

const tajawal = Tajawal({
  variable: "--font-arabic-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

const cairo = Cairo({
  variable: "--font-arabic-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SatuMenitAja",
  description:
    "Al-Quran web app mobile-first untuk baca cepat, bookmark, last read, dan personalisasi.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${notoNaskhArabic.variable} ${amiri.variable} ${scheherazadeNew.variable} ${markaziText.variable} ${notoKufiArabic.variable} ${tajawal.variable} ${cairo.variable} ${notoSansArabic.variable}`}
      >
        <PreferencesProvider>
          <AppShell>{children}</AppShell>
        </PreferencesProvider>
      </body>
    </html>
  );
}
