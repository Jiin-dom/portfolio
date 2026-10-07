import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif, DM_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/lib/content";
import "./globals.css";

/* Variable grotesk with a width axis: condensed for the wordmark, normal for UI */
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

/* Editorial italic accent, specimen-poster pairing */
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

/* Oryzo uses DM Mono for micro labels */
const mono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: `${site.shortName} · Full-stack Developer`,
  description: site.tagline,
  icons: {
    icon: "/images/jplogo.png",
  },
  openGraph: {
    title: `${site.shortName} · Full-stack Developer`,
    description: site.tagline,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="site-shell flex min-h-full flex-col font-sans">
        <SmoothScroll>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
