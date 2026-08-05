import type { Metadata } from "next";
import { DM_Sans, Fira_Code, Fraunces } from "next/font/google";

import { MotionProvider } from "@/components/layout/MotionProvider";

import "./globals.css";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Cerebrizky",
  description: "Personal second brain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
      >
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
