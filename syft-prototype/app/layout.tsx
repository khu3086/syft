import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWA from "./components/PWA";

export const metadata: Metadata = {
  applicationName: "Syft",
  title: "Syft — Describe your person. Meet your match.",
  description:
    "No swiping. Describe who you're looking for in plain English and meet a small, honest shortlist of people who fit.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Syft",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <PWA />
      </body>
    </html>
  );
}
