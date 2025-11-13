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
    default: "Serdar Salim Domurcuk – Digital notes on my interests",
    template: "%s | Serdar Salim Domurcuk"
  },
  description: "Writing, research notes, and product experiments by Serdar Salim Domurcuk covering design, technology, publishing systems, and self-directed work.",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://halqa.xyz',
    siteName: 'Serdar Salim Domurcuk',
    title: 'Serdar Salim Domurcuk – Digital notes on my interests',
    description: 'Essays and field notes on design, technology, publishing workflows, and independent creative practice by Serdar Salim Domurcuk.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Serdar Salim Domurcuk – Digital notes on my interests',
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Serdar Salim Domurcuk – Digital notes on my interests',
    description: 'Daily notes, essays, and product experiments on design, systems thinking, and digital publishing by Serdar Salim Domurcuk.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://halqa.xyz',
    types: {
      'application/rss+xml': 'https://halqa.xyz/feed.xml',
    },
  },
  keywords: 'Serdar Salim Domurcuk, personal blog, independent publishing, product design, technology, digital notes, research, essays',
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
