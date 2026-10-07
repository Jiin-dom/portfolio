import type { Metadata } from "next";
import { Host_Grotesk, DM_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/lib/content";
import "./globals.css";

/* Closest free stand-in for Oryzo's Halyard Display */
const display = Host_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${display.variable} ${mono.variable} h-full antialiased`}>
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
