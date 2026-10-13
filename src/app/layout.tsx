import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, Manrope } from "next/font/google";
import { meta } from "@/content/copy";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
  appleWebApp: { capable: true, title: meta.title, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#12040e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${caveat.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
