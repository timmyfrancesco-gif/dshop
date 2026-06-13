import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import CustomCursor from "@/components/ui/CustomCursor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Astro Exchange — Crypto Escrow, Middleman & Exchange on Discord",
  description:
    "Astro Exchange is a Discord-based crypto trading hub offering escrow, middleman services, exchange, advertising slots, a digital shop and a casino.",
  openGraph: {
    title: "Astro Exchange",
    description:
      "Crypto escrow, middleman, exchange, casino and more — all on Discord.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
