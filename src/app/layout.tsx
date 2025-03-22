import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { BlogProvider } from "./blogContext";
import GoogleTagManager from "./components/GoogleTagManager";
import Analytics from "./components/analytics";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SLM Blog",
  description: "A modern blog built with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GTM_ID = 'GTM-KJKN7R99'

  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <GoogleTagManager gtmId={GTM_ID} />
        <Analytics />
        
        <BlogProvider>
          <Navbar />
          {children}
          <Footer />
        </BlogProvider>
      </body>
    </html>
  );
}