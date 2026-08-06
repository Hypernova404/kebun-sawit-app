import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SawitDesk - Manajemen Kebun Kelapa Sawit",
  description: "Kalkulator agronomi & manajemen kebun kelapa sawit: populasi, pemupukan, produksi, ekonomi, dan laporan.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
