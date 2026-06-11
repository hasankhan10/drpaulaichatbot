import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dr. Paul's Online Clinic - Primary Care & Medical Weight Loss",
  description: "Experience modern primary care and expert medical weight loss supervised by Dr. Paul Harrison, MD. Connect virtually or in-person in Austin, TX.",
  keywords: ["doctor online", "medical weight loss", "telehealth Austin", "Dr. Paul Harrison MD", "primary care Austin"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-transparent text-[#0f172a]">
        <main className="flex-1">
          {children}
        </main>
        {/* Globally active floating Chat Widget */}
        <ChatWidget />
      </body>
    </html>
  );
}

