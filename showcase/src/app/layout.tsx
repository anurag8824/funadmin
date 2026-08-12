import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FuntApp — Create, Share & Connect",
  description:
    "Your fun social world. Watch reels, share stories, go live, and connect with creators on FuntApp.",
  openGraph: {
    title: "FuntApp — Create, Share & Connect",
    description:
      "Short videos, live moments, real connections. Download FuntApp on Google Play.",
    type: "website",
    siteName: "FuntApp",
  },
  twitter: {
    card: "summary_large_image",
    title: "FuntApp — Create, Share & Connect",
    description: "Your fun social world. Download on Google Play.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
