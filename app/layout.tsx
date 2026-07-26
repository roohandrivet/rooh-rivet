import type {
  Metadata,
} from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

import "./globals.css";

export const revalidate = 300;

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

const SITE_URL =
  "https://www.roohandrivet.com";

type GlobalSettings = {
  store_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  seo_title: string;
  seo_description: string;
  seo_image_url: string;
};

type GlobalSettingsDatabaseRow = {
  store_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
};

const DEFAULT_SETTINGS:
  GlobalSettings = {
  store_name:
    "Rooh & Rivet",
  tagline:
    "Timeless Elegance, Crafted for You",
  logo_url:
    "/logo-icon.png",
  favicon_url:
    "/logo-icon.png",
  seo_title:
    "Rooh & Rivet | Luxury Handcrafted Jewellery",
  seo_description:
    "Discover timeless handcrafted jewellery by Rooh & Rivet. Premium designs inspired by heritage, elegance and modern luxury.",
  seo_image_url:
    "/og-image.jpg",
};

function normaliseAssetUrl(
  value: string,
  fallback: string
): string {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return fallback;
  }

  if (
    trimmed.startsWith(
      "https://"
    ) ||
    trimmed.startsWith(
      "http://"
    ) ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return `/${trimmed}`;
}

async function loadGlobalSettings():
  Promise<GlobalSettings> {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    console.error(
      "Supabase public environment variables are missing."
    );

    return DEFAULT_SETTINGS;
  }

  try {
    const endpoint =
      new URL(
        "/rest/v1/settings",
        supabaseUrl
      );

    endpoint.searchParams.set(
      "select",
      [
        "store_name",
        "tagline",
        "logo_url",
        "favicon_url",
        "seo_title",
        "seo_description",
        "seo_image_url",
      ].join(",")
    );

    endpoint.searchParams.set(
      "setting_key",
      "eq.store"
    );

    endpoint.searchParams.set(
      "limit",
      "1"
    );

    const response =
      await fetch(
        endpoint.toString(),
        {
          headers: {
            apikey:
              supabaseAnonKey,
            Authorization:
              `Bearer ${supabaseAnonKey}`,
            Accept:
              "application/json",
          },
          next: {
            revalidate:
              300,
            tags: [
              "global-settings",
            ],
          },
        }
      );

    if (
      !response.ok
    ) {
      console.error(
        "Global settings request failed:",
        response.status,
        response.statusText
      );

      return DEFAULT_SETTINGS;
    }

    const rows =
      (await response.json()) as
        GlobalSettingsDatabaseRow[];

    const row =
      rows[0];

    if (!row) {
      return DEFAULT_SETTINGS;
    }

    return {
      store_name:
        row.store_name?.trim() ||
        DEFAULT_SETTINGS.store_name,

      tagline:
        row.tagline?.trim() ||
        DEFAULT_SETTINGS.tagline,

      logo_url:
        normaliseAssetUrl(
          row.logo_url ?? "",
          DEFAULT_SETTINGS.logo_url
        ),

      favicon_url:
        normaliseAssetUrl(
          row.favicon_url ?? "",
          DEFAULT_SETTINGS.favicon_url
        ),

      seo_title:
        row.seo_title?.trim() ||
        DEFAULT_SETTINGS.seo_title,

      seo_description:
        row.seo_description?.trim() ||
        DEFAULT_SETTINGS.seo_description,

      seo_image_url:
        normaliseAssetUrl(
          row.seo_image_url ?? "",
          DEFAULT_SETTINGS.seo_image_url
        ),
    };
  } catch (
    error: unknown
  ) {
    console.error(
      "Unable to load global settings:",
      error
    );

    return DEFAULT_SETTINGS;
  }
}

function toAbsoluteUrl(
  value: string
): string {
  if (
    value.startsWith(
      "https://"
    ) ||
    value.startsWith(
      "http://"
    )
  ) {
    return value;
  }

  return new URL(
    value,
    SITE_URL
  ).toString();
}

export async function generateMetadata():
  Promise<Metadata> {
  const settings =
    await loadGlobalSettings();

  return {
    metadataBase:
      new URL(
        SITE_URL
      ),

    title: {
      default:
        settings.seo_title,

      template:
        `%s | ${settings.store_name}`,
    },

    description:
      settings.seo_description,

    keywords: [
      "luxury jewellery",
      "handcrafted jewellery",
      "premium jewellery",
      "women jewellery",
      "necklaces",
      "rings",
      "earrings",
      settings.store_name,
    ],

    authors: [
      {
        name:
          settings.store_name,

        url:
          SITE_URL,
      },
    ],

    creator:
      settings.store_name,

    publisher:
      settings.store_name,

    alternates: {
      canonical:
        SITE_URL,
    },

    icons: {
      icon: [
        {
          url:
            settings.favicon_url,
        },
      ],

      shortcut: [
        {
          url:
            settings.favicon_url,
        },
      ],

      apple: [
        {
          url:
            settings.favicon_url,
        },
      ],
    },

    openGraph: {
      type:
        "website",

      locale:
        "en_IN",

      url:
        SITE_URL,

      siteName:
        settings.store_name,

      title:
        settings.seo_title,

      description:
        settings.seo_description,

      images: [
        {
          url:
            settings.seo_image_url,

          width:
            1200,

          height:
            630,

          alt:
            `${settings.store_name} social sharing image`,
        },
      ],
    },

    twitter: {
      card:
        "summary_large_image",

      title:
        settings.seo_title,

      description:
        settings.seo_description,

      images: [
        settings.seo_image_url,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  const settings =
    await loadGlobalSettings();

  const logoUrl =
    toAbsoluteUrl(
      settings.logo_url
    );

  const sharingImageUrl =
    toAbsoluteUrl(
      settings.seo_image_url
    );

  const organizationSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "Organization",

    name:
      settings.store_name,

    url:
      SITE_URL,

    logo:
      logoUrl,

    image:
      sharingImageUrl,

    description:
      settings.seo_description,

    slogan:
      settings.tagline,
  };

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
          <Navbar />

          {children}

          <Footer />
        </Providers>
      </body>
    </html>
  );
}