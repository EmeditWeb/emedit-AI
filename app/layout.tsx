import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme";
import { ThemedClerkAppearance } from "@/components/themed-clerk-appearance";

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
  title: "Emedit AI",
  description: "Real-time collaborative system design workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <ThemedClerkAppearance>
        <html
          lang="en"
          className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
        >
          <body className="min-h-full flex flex-col">{children}</body>
        </html>
      </ThemedClerkAppearance>
    </ThemeProvider>
  );
}