import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StatHub — Insights Library | Premium Statistics Publication",
  description:
    "Explore a curated library of datasets, publisher-style summaries, and chart-driven reports. GDP, inflation, AI, climate, population and more — inspired by Statista, Our World in Data, and Knoema.",
  keywords: [
    "statistics",
    "data visualization",
    "GDP",
    "inflation",
    "AI market",
    "climate data",
    "population",
    "economic indicators",
    "Statista",
    "Our World in Data",
    "data library",
    "charts",
  ],
  authors: [{ name: "StatHub" }],
  openGraph: {
    title: "StatHub — Insights Library",
    description:
      "A premium statistics library for evidence-driven decisions. Curated datasets, editorial insights, and interactive visualizations.",
    siteName: "StatHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StatHub — Insights Library",
    description: "Premium statistics publication with editorial insights and interactive charts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
