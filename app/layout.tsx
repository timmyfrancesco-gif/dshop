import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { LocaleProvider } from "@/lib/contexts/LocaleContext";
import { CartProvider } from "@/lib/hooks/useCart";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <LocaleProvider>
            <CartProvider>{children}</CartProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
