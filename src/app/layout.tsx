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
  title: "Utsav AI - Intelligent Celebration Planning Engine",
  description:
    "Plan memorable Indian weddings, birthdays, and corporate events with deterministic 40/30/15/15 budget logic and dynamic Gemini 2.5 AI synthesis.",
  keywords: [
    "Utsav AI",
    "event planning",
    "Indian wedding planner",
    "AI event planner",
    "budget allocation",
    "celebration planner",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
