import NextAuthProvider from "@/provider/NextAuthProvider";
import { AppI18nProvider } from "@/provider/i18n-provider";
import TanStackQueryProvider from "@/provider/TanstackProvider";
import { ThemeProvider } from "@/provider/theme-provider";
import "@/styles/globals.css";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n/resources";
import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lumina Studio",
  description: "AI-powered presentation creation and editing.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <TanStackQueryProvider>
          <NextAuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AppI18nProvider initialLocale={initialLocale}>
                {children}
              </AppI18nProvider>
            </ThemeProvider>
          </NextAuthProvider>
        </TanStackQueryProvider>
      </body>
    </html>
  );
}
