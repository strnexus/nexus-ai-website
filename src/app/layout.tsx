import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Nexus AI - Discover Your Perfect AI Tools in 60 Seconds",
  description: "Stop searching through endless AI directories. Nova, your intelligent guide, understands your business and delivers personalized tool recommendations that amplify what you do best.",
  keywords: "AI tools, business automation, AI discovery, Nova AI assistant, SMB AI solutions",
  authors: [{ name: "Nexus AI" }],
  openGraph: {
    title: "Nexus AI - Discover Your Perfect AI Tools",
    description: "Where business growth feels good. Experience effortless AI discovery designed for your success.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus AI - Discover Your Perfect AI Tools",
    description: "Stop searching through endless AI directories. Nova delivers personalized recommendations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
