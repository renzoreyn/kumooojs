import type { Metadata } from "next";
import { Figtree, Orbitron, Outfit, Space_Grotesk } from "next/font/google";
import { MadeWithKumooo } from "@kumooo/brand/made-with";
import { themeBootScript } from "@kumooo/theme-packs";
import { Providers } from "../components/providers";
import "./globals.css";

const y2kSans = Space_Grotesk({ subsets: ["latin"], variable: "--font-y2k-sans" });
const y2kDisplay = Orbitron({ subsets: ["latin"], variable: "--font-y2k-display" });
const kumoooSans = Figtree({ subsets: ["latin"], variable: "--font-kumooo-sans" });
const kumoooDisplay = Outfit({ subsets: ["latin"], variable: "--font-kumooo-display" });

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.kumooo.site"),
  title: "Shop · kumooo.js",
  description: "Shop demo with y2k / kumooo / glass skins. Admin: admin / admin. Resets daily at 00:00 UTC.",
  openGraph: {
    title: "Shop · kumooo.js",
    description: "Shop demo with y2k / kumooo / glass skins. Fake bag - no payment. Resets daily.",
    type: "website",
    url: "https://shop.kumooo.site",
    siteName: "kumooo.js",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop · kumooo.js",
    description: "Shop demo with skins. Fake bag - no payment.",
  },
};

const fontVars = `${y2kSans.variable} ${y2kDisplay.variable} ${kumoooSans.variable} ${kumoooDisplay.variable}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars} data-skin="kumooo" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript("kumooo") }} />
      </head>
      <body className="min-h-screen antialiased">
        <div className="border-b border-[var(--ink)]/20 bg-[var(--hot)] px-4 py-1.5 text-center text-[11px] font-bold tracking-wide text-black">
          Shop demo. Skins: Y2K / kumooo / Glass. Admin admin/admin. Resets 00:00 UTC. No real money.
        </div>
        <Providers>{children}</Providers>
        <MadeWithKumooo />
      </body>
    </html>
  );
}
