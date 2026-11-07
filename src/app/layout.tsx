import type { Metadata } from "next";
import { Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import Footer from "@/components/Footer";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "variable",
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HORIZON — Intelligence Beyond Limits",
    template: "%s | HORIZON",
  },
  description: "Access independently developed AI models. Chat, subscribe, benchmark.",
  applicationName: "HORIZON",
  keywords: ["AI", "models", "chat", "benchmarks", "subscriptions", "HORIZON"],
  authors: [{ name: "HORIZON" }],
  creator: "HORIZON",
  publisher: "HORIZON",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/horizon-mark-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/horizon-mark-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/horizon-mark-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/horizon-mark-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    siteName: "HORIZON",
    title: "HORIZON — Intelligence Beyond Limits",
    description: "Access independently developed AI models. Chat, subscribe, benchmark.",
    url: siteUrl,
    images: [
      {
        url: "/brand/horizon-mark-512.png",
        width: 512,
        height: 512,
        alt: "HORIZON",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HORIZON — Intelligence Beyond Limits",
    description: "Access independently developed AI models. Chat, subscribe, benchmark.",
    images: ["/brand/horizon-mark-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="antialiased bg-[var(--bg)] text-[var(--fg)] font-body">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-[var(--accent)] focus:text-[var(--accent-fg)] focus:shadow-lg focus:outline-none">
          Skip to main content
        </a>
        <ThemeProvider>
          <Providers>
            {children}
            <Footer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}