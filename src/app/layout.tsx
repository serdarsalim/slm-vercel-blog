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
import { Providers } from "./providers";


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

// Update your metadata in layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://halqa.xyz'),
  title: {
    default: "HALQA – JOIN THE CIRCLE",
    template: "%s | HALQA"
  },
  description: "Write, edit, and publish content instantly with a clean, no-setup interface.",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://halqa.xyz',
    siteName: 'HALQA',
    images: [{
      url: '/og-image.jpg', // Create this image in your public folder
      width: 1200,
      height: 630,
      alt: 'HALQA – JOIN THE CIRCLE',
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HALQA – JOIN THE CIRCLE',
    description: 'Write, edit, and publish content instantly with a clean, no-setup interface.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://halqa.xyz',
    types: {
      'application/rss+xml': 'https://halqa.xyz/feed.xml',
    },
  },
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
      <Providers>
        <GoogleTagManager gtmId={GTM_ID} />
        <Analytics />
        <ScrollManager />
        <BlogProvider>
          <Navbar />
          {children}
          <SpeedInsights />
          <Footer />
        </BlogProvider>
        </Providers>
      </body>
    </html>
  );
}