import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Document based AI assistant",
    template: "%s · Document based AI assistant",
  },
  description:
    "Upload PDFs, DOCX, and TXT files and ask questions with exact source citations. Production-grade RAG document intelligence.",
  applicationName: "Document based AI assistant",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Document based AI assistant",
    description:
      "Chat with your documents. Every answer is grounded with exact citations.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
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
      <head>
        {/* Inline SVG favicon for maximum browser compatibility */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'%3E%3Cpath d='M6 8C6 5.79086 7.79086 4 10 4H18L26 12V24C26 26.2091 24.2091 28 22 28H10C7.79086 28 6 26.2091 6 24V8Z' fill='%231e40af'/%3E%3Cpath d='M10 8C10 5.79086 11.7909 4 14 4H18L26 12V20C26 22.2091 24.2091 24 22 24H14C11.7909 24 10 22.2091 10 20V8Z' fill='%233b82f6'/%3E%3Cpath d='M18 4V12H26L18 4Z' fill='%2393c5fd' opacity='0.9'/%3E%3Crect x='13' y='14' width='7' height='2' rx='1' fill='white' opacity='0.8'/%3E%3Crect x='13' y='18' width='5' height='2' rx='1' fill='white' opacity='0.8'/%3E%3C/svg%3E"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-blue-500/20">
        {children}
        <Toaster theme="light" position="bottom-right" richColors />
      </body>
    </html>
  );
}
