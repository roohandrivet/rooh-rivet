"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { FaInstagram } from "react-icons/fa6";

import { supabase } from "@/lib/supabase";

type GlobalSettingsRow = {
  instagram: string | null;
  store_name: string | null;
};

type InstagramSettings = {
  instagramUrl: string;
  storeName: string;
};

const DEFAULT_STORE_NAME =
  "Rooh & Rivet";

const GALLERY_IMAGES = [
  {
    id: 1,
    image: "/instagram/1.jpg",
    alt: "Luxury Necklace",
  },
  {
    id: 2,
    image: "/instagram/2.jpg",
    alt: "Pearl Jewellery",
  },
  {
    id: 3,
    image: "/instagram/3.jpg",
    alt: "Gold Earrings",
  },
  {
    id: 4,
    image: "/instagram/4.jpg",
    alt: "Bridal Collection",
  },
  {
    id: 5,
    image: "/instagram/5.jpg",
    alt: "Luxury Ring",
  },
  {
    id: 6,
    image: "/instagram/6.jpg",
    alt: "Handcrafted Jewellery",
  },
];

function normaliseInstagramUrl(
  value: string | null | undefined
): string {
  const trimmed =
    value?.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith(
      "https://"
    ) ||
    trimmed.startsWith(
      "http://"
    )
  ) {
    try {
      const url =
        new URL(trimmed);

      if (
        !url.hostname
          .toLowerCase()
          .includes(
            "instagram.com"
          )
      ) {
        return "";
      }

      return url.toString();
    } catch {
      return "";
    }
  }

  if (
    trimmed.startsWith("@")
  ) {
    const username =
      trimmed
        .slice(1)
        .trim()
        .replace(
          /^\/+|\/+$/g,
          ""
        );

    return username
      ? `https://www.instagram.com/${username}/`
      : "";
  }

  if (
    trimmed
      .toLowerCase()
      .includes(
        "instagram.com"
      )
  ) {
    try {
      const url =
        new URL(
          `https://${trimmed}`
        );

      return url.toString();
    } catch {
      return "";
    }
  }

  const username =
    trimmed.replace(
      /^\/+|\/+$/g,
      ""
    );

  return username
    ? `https://www.instagram.com/${username}/`
    : "";
}

function getInstagramHandle(
  instagramUrl: string
): string {
  try {
    const url =
      new URL(
        instagramUrl
      );

    const username =
      url.pathname
        .split("/")
        .filter(Boolean)[0];

    return username
      ? `@${username}`
      : "Instagram";
  } catch {
    return "Instagram";
  }
}

export default function InstagramGallery() {
  const [
    settings,
    setSettings,
  ] =
    useState<InstagramSettings>({
      instagramUrl: "",
      storeName:
        DEFAULT_STORE_NAME,
    });

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadInstagramSettings():
      Promise<void> {
      try {
        const {
          data,
          error,
        } = await supabase
          .from("settings")
          .select(
            `
              instagram,
              store_name
            `
          )
          .eq(
            "setting_key",
            "store"
          )
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        const row =
          data as
            | GlobalSettingsRow
            | null;

        setSettings({
          instagramUrl:
            normaliseInstagramUrl(
              row?.instagram
            ),

          storeName:
            row?.store_name
              ?.trim() ||
            DEFAULT_STORE_NAME,
        });
      } catch (
        error: unknown
      ) {
        console.error(
          "Failed to load Instagram settings:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInstagramSettings();

    return () => {
      active = false;
    };
  }, []);

  const instagramHandle =
    useMemo(
      () =>
        getInstagramHandle(
          settings.instagramUrl
        ),
      [
        settings.instagramUrl,
      ]
    );

  if (
    loading ||
    !settings.instagramUrl
  ) {
    return null;
  }

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
            Follow Our Journey
          </p>

          <a
            href={
              settings.instagramUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${instagramHandle} on Instagram`}
            className="mt-6 inline-block font-serif text-5xl text-[#4B2E2E] transition hover:text-[#5A2D2D]"
          >
            {
              instagramHandle
            }
          </a>

          <p className="mt-6 leading-8 text-[#7A6464]">
            A glimpse into the world of{" "}
            {
              settings.storeName
            }
            —timeless craftsmanship,
            elegant styling and moments
            that inspire every
            handcrafted piece.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY_IMAGES.map(
            (item) => (
              <a
                key={
                  item.id
                }
                href={
                  settings.instagramUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${instagramHandle} on Instagram`}
                className="group relative overflow-hidden rounded-[32px]"
              >
                <div className="relative aspect-square overflow-hidden bg-[#F8F4EF]">
                  <Image
                    src={
                      item.image
                    }
                    alt={
                      item.alt
                    }
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-[#4B2E2E]/0 transition duration-500 group-hover:bg-[#4B2E2E]/50" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-500 group-hover:opacity-100">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
                      <FaInstagram
                        className="text-[#4B2E2E]"
                        size={34}
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-6 transition duration-500 group-hover:translate-y-0">
                  <p className="font-serif text-xl text-white">
                    {
                      item.alt
                    }
                  </p>

                  <p className="mt-2 text-sm text-white/80">
                    Tap to visit our
                    Instagram
                  </p>
                </div>
              </a>
            )
          )}
        </div>

        <div className="mt-16 text-center">
          <a
            href={
              settings.instagramUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow ${instagramHandle} on Instagram`}
            className="inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-10 py-5 font-medium text-white transition duration-300 hover:scale-105 hover:bg-[#472323]"
          >
            <FaInstagram
              size={22}
            />

            Follow{" "}
            {
              instagramHandle
            }
          </a>

          <p className="mx-auto mt-6 max-w-2xl text-[#8B6B5B]">
            Follow us for exclusive
            jewellery launches,
            behind-the-scenes
            craftsmanship, styling
            inspiration and beautiful
            moments from the{" "}
            {
              settings.storeName
            }{" "}
            community.
          </p>
        </div>
      </div>
    </section>
  );
}