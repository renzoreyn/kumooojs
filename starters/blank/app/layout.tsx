import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { MadeWithKumooo } from "@kumooo/brand/made-with";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Sora({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Blank · kumooo.js",
  description: "Blank Next.js starter with @kumooo/ui.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Blank · kumooo.js",
    description: "Blank Next.js starter with @kumooo/ui.",
    type: "website",
    siteName: "kumooo.js",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blank · kumooo.js",
    description: "Blank Next.js starter with @kumooo/ui.",
  },
};

const themeInit = `(function(){try{var k='kumooo-blank-theme';var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen antialiased">
        <SiteHeader />
        {children}
        <MadeWithKumooo />
      </body>
    </html>
  );
}
