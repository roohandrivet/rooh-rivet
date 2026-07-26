import type {
  Metadata,
} from "next";
import Link from "next/link";
import {
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Contact Us | Rooh & Rivet",
  description:
    "Contact Rooh & Rivet for product, order and customer-care enquiries.",
};

export const revalidate = 300;

type ContactContent = {
  address: string;
  phone: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  x_url: string;
  youtube_url: string;
  linkedin_url: string;
  pinterest_url: string;
  whatsapp_url: string;
};

const DEFAULT_CONTENT: ContactContent = {
  address: "",
  phone: "",
  email: "hello@roohandrivet.com",
  facebook_url: "",
  instagram_url: "",
  x_url: "",
  youtube_url: "",
  linkedin_url: "",
  pinterest_url: "",
  whatsapp_url: "",
};

function normalisePhoneLink(
  phone: string
): string {
  return phone.replace(
    /[^\d+]/g,
    ""
  );
}

export default async function ContactPage() {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("site_content")
    .select(
      `
        address,
        phone,
        email,
        facebook_url,
        instagram_url,
        x_url,
        youtube_url,
        linkedin_url,
        pinterest_url,
        whatsapp_url
      `
    )
    .eq("page", "contact")
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load Contact page content:",
      error
    );
  }

  const content:
    ContactContent = {
    address:
      data?.address?.trim() ||
      DEFAULT_CONTENT.address,
    phone:
      data?.phone?.trim() ||
      DEFAULT_CONTENT.phone,
    email:
      data?.email?.trim() ||
      DEFAULT_CONTENT.email,
    facebook_url:
      data?.facebook_url?.trim() ||
      DEFAULT_CONTENT.facebook_url,
    instagram_url:
      data?.instagram_url?.trim() ||
      DEFAULT_CONTENT.instagram_url,
    x_url:
      data?.x_url?.trim() ||
      DEFAULT_CONTENT.x_url,
    youtube_url:
      data?.youtube_url?.trim() ||
      DEFAULT_CONTENT.youtube_url,
    linkedin_url:
      data?.linkedin_url?.trim() ||
      DEFAULT_CONTENT.linkedin_url,
    pinterest_url:
      data?.pinterest_url?.trim() ||
      DEFAULT_CONTENT.pinterest_url,
    whatsapp_url:
      data?.whatsapp_url?.trim() ||
      DEFAULT_CONTENT.whatsapp_url,
  };

  const socialLinks = [
    {
      label: "Instagram",
      href: content.instagram_url,
    },
    {
      label: "Facebook",
      href: content.facebook_url,
    },
    {
      label: "X",
      href: content.x_url,
    },
    {
      label: "LinkedIn",
      href: content.linkedin_url,
    },
    {
      label: "YouTube",
      href: content.youtube_url,
    },
    {
      label: "Pinterest",
      href: content.pinterest_url,
    },
    {
      label: "WhatsApp",
      href: content.whatsapp_url,
    },
  ].filter(
    (item) =>
      item.href.length > 0
  );

  return (
    <main className="bg-[#F8F4EF] text-[#4B2E2E]">
      <section className="border-b border-[#E8DED2]">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
          <p className="text-sm uppercase tracking-[0.36em] text-[#8B6B5B]">
            We Would Love to Hear From You
          </p>

          <h1 className="mt-6 font-serif text-6xl md:text-7xl">
            Contact Rooh &amp; Rivet
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#725D59]">
            Speak with us about a piece, an order or anything else you need.
            Our team will be happy to help.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-[28px] border border-[#E7DBD1] bg-white p-8">
            <Mail className="text-[#5A2D2D]" />

            <h2 className="mt-6 font-serif text-2xl">
              Email
            </h2>

            <Link
              href={`mailto:${content.email}`}
              className="mt-3 block break-words leading-7 text-[#725D59] transition hover:text-[#5A2D2D]"
            >
              {content.email}
            </Link>
          </article>

          <article className="rounded-[28px] border border-[#E7DBD1] bg-white p-8">
            <Phone className="text-[#5A2D2D]" />

            <h2 className="mt-6 font-serif text-2xl">
              Phone
            </h2>

            {content.phone ? (
              <Link
                href={`tel:${normalisePhoneLink(
                  content.phone
                )}`}
                className="mt-3 block leading-7 text-[#725D59] transition hover:text-[#5A2D2D]"
              >
                {content.phone}
              </Link>
            ) : (
              <p className="mt-3 leading-7 text-[#725D59]">
                Add a phone number in Content Management.
              </p>
            )}
          </article>

          <article className="rounded-[28px] border border-[#E7DBD1] bg-white p-8">
            <MapPin className="text-[#5A2D2D]" />

            <h2 className="mt-6 font-serif text-2xl">
              Address
            </h2>

            <p className="mt-3 whitespace-pre-line leading-7 text-[#725D59]">
              {content.address ||
                "Add the business address in Content Management."}
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-[#E8DED2] bg-[#5A2D2D] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <MessageCircle
            size={30}
            className="mx-auto text-[#E6CAC0]"
          />

          <p className="mt-5 text-sm uppercase tracking-[0.34em] text-[#E6CAC0]">
            Stay Connected
          </p>

          <h2 className="mt-5 font-serif text-5xl">
            Follow the world of Rooh &amp; Rivet.
          </h2>

          {socialLinks.length > 0 ? (
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {socialLinks.map(
                (item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 font-medium transition hover:bg-white hover:text-[#5A2D2D]"
                  >
                    {item.label}

                    <ExternalLink
                      size={16}
                    />
                  </Link>
                )
              )}
            </div>
          ) : (
            <p className="mx-auto mt-7 max-w-xl leading-8 text-[#F2DEDA]">
              Social links can be added from Admin → Content → Contact.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}