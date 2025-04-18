import type { Metadata } from "next";
import { Inter, Roboto_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { BlogProvider } from "./blogContext";
import GoogleTagManager from "./components/GoogleTagManager";
import Analytics from "./components/analytics";
import { SpeedInsights } from '@vercel/speed-insights/next';
import ScrollManager from "./components/ScrollManager";

// Keep your existing Inter font
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Add Merriweather for serif
const merriweather = Merriweather({
  variable: "--font-serif",
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WriteAway",
  description: "A blog about technology, history and some personal stuff.",
};
// Add this line to your layout.tsx
export const scrollRestoration = 'manual'; // Let browser handle restoration
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GTM_ID = 'GTM-KJKN7R99'

  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} ${robotoMono.variable} antialiased`}>
        <GoogleTagManager gtmId={GTM_ID} />
        <Analytics />
        <ScrollManager />
        <BlogProvider>
          <Navbar />
          {children}
          <SpeedInsights />
          <Footer />
    
        </BlogProvider>
      </body>
    </html>
  );
}