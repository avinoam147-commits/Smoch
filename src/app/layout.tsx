import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  openGraph: { siteName: "סמוך", locale: "he_IL", type: "website" },
  title: {
    default: "סמוך — ביקורות אמיתיות על שירותים וקורסים באינטרנט",
    template: "%s · סמוך",
  },
  description:
    "ביקורות ודירוגים של לקוחות אמיתיים על קורסים, ליווי ושירותים דיגיטליים בישראל: מסחר, דרופשיפינג, שיווק ועוד. לפני שמשלמים, בודקים.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {!isSupabaseConfigured && (
          <div className="bg-ink px-4 py-1.5 text-center text-xs text-bg">
            גרסת הדגמה. כל החברות והביקורות באתר בדויות.
          </div>
        )}
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
