import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

import "./globals.css";


const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {

  metadataBase: new URL(
    "https://roohandrivet.com"
  ),


  title: {
    default:
      "Rooh & Rivet | Luxury Handcrafted Jewellery",

    template:
      "%s | Rooh & Rivet",
  },


  description:
    "Discover timeless handcrafted jewellery by Rooh & Rivet. Premium designs inspired by heritage, elegance and modern luxury.",


  keywords: [
    "luxury jewellery",
    "handcrafted jewellery",
    "premium jewellery",
    "women jewellery",
    "necklaces",
    "rings",
    "earrings",
    "Rooh & Rivet",
  ],


  authors: [
    {
      name:
        "Rooh & Rivet",
    },
  ],


  creator:
    "Rooh & Rivet",


  openGraph: {

    type:
      "website",

    locale:
      "en_IN",

    url:
      "https://roohandrivet.com",

    siteName:
      "Rooh & Rivet",

    title:
      "Rooh & Rivet | Luxury Handcrafted Jewellery",

    description:
      "Premium handcrafted jewellery designed for timeless elegance.",

    images: [
      {
        url:
          "/og-image.jpg",

        width:
          1200,

        height:
          630,

        alt:
          "Rooh & Rivet Luxury Jewellery",
      },
    ],
  },


  twitter: {

    card:
      "summary_large_image",

    title:
      "Rooh & Rivet | Luxury Handcrafted Jewellery",

    description:
      "Premium handcrafted jewellery designed for timeless elegance.",

    images: [
      "/og-image.jpg",
    ],
  },


  robots: {

    index:
      true,

    follow:
      true,

    googleBot: {

      index:
        true,

      follow:
        true,

    },
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <html lang="en">

      <body
        className={`${geist.variable} ${geistMono.variable} bg-[#F8F4EF]`}
      >

        <Providers>

          <Navbar />

          {children}

          <Footer />

        </Providers>

      </body>

    </html>

  );
}