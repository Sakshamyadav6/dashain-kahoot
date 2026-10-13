import type { Metadata, Viewport } from "next";
import { Lilita_One, Noto_Sans, Noto_Sans_Devanagari, Yatra_One } from "next/font/google";
import "./globals.css";

const display = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-family",
  display: "swap",
});

const body = Noto_Sans({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  weight: ["500", "700", "800"],
  subsets: ["devanagari"],
  variable: "--font-deva",
  display: "swap",
});

const festive = Yatra_One({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-yatra",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dashain Tihar Quiz",
    template: "%s · Dashain Tihar Quiz",
  },
  description:
    "A live Dashain and Tihar quiz. Scan the QR code, join with a PIN, and answer on your phone.",
};

export const viewport: Viewport = {
  themeColor: "#2a0618",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${devanagari.variable} ${festive.variable} h-full antialiased`}
    >
      <body className="min-h-dvh font-sans text-cream">{children}</body>
    </html>
  );
}
