import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "סמוך — ביקורות אמיתיות על קורסי מסחר",
    template: "%s · סמוך",
  },
  description:
    "דירוגים וביקורות ציבוריות על קורסי מסחר, קבוצות איתותים וליווי בישראל. לפני שמשלמים, בודקים.",
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
        <div className="bg-ink text-bg text-center text-xs py-1.5 px-4">
          גרסת הדגמה. כל החברות והביקורות באתר בדויות.
        </div>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
