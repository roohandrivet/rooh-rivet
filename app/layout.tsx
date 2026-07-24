import type {
  Metadata,
} from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

import "./globals.css";

const geist = Geist({
  variable:
    "--font-geist",
  subsets: ["latin"],
});

const geistMono =
  Geist_Mono({
    variable:
      "--font-geist-mono",
    subsets: ["latin"],
  });

const siteUrl =
  "https://roohandrivet.com";

export const metadata: Metadata = {
  metadataBase:
    new URL(siteUrl),

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

      url:
        siteUrl,
    },
  ],

  creator:
    "Rooh & Rivet",

  publisher:
    "Rooh & Rivet",

  alternates: {
    canonical:
      siteUrl,
  },

  icons: {
    icon: [
      {
        url:
          "/logo-icon.png",

        type:
          "image/png",

        sizes:
          "512x512",
      },
    ],

    shortcut: [
      {
        url:
          "/logo-icon.png",

        type:
          "image/png",
      },
    ],

    apple: [
      {
        url:
          "/logo-icon.png",

        type:
          "image/png",

        sizes:
          "512x512",
      },
    ],
  },

  openGraph: {
    type:
      "website",

    locale:
      "en_IN",

    url:
      siteUrl,

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

      "max-image-preview":
        "large",

      "max-snippet":
        -1,

      "max-video-preview":
        -1,
    },
  },
};

const organizationSchema = {
  "@context":
    "https://schema.org",

  "@type":
    "Organization",

  name:
    "Rooh & Rivet",

  url:
    siteUrl,

  logo:
    `${siteUrl}/logo-icon.png`,

  image:
    `${siteUrl}/logo-icon.png`,

  description:
    "Luxury handcrafted jewellery inspired by heritage, elegance and modern design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body
        className={`${geist.variable} ${geistMono.variable} bg-[#F8F4EF]`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              JSON.stringify(
                organizationSchema
              ),
          }}
        />

        <Providers>
          <AnnouncementBar />

          <Navbar />

          {children}

          <Footer />
        </Providers>
      </body>
    </html>
  );
}