"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Phone } from "lucide-react";

type ContactContent = {
  address: string;
  phone: string;
  email: string;
  google_maps_url: string;
  business_hours: string;
  instagram_url: string;
};

export default function ContactContentPage() {
  const [loading] = useState(false);

  const [content, setContent] = useState<ContactContent>({
    address: "",
    phone: "",
    email: "",
    google_maps_url: "",
    business_hours: "",
    instagram_url: "",
  });

  return (
    <div className="min-h-screen bg-[#F8F4EF] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5E7E0]">
              <Phone className="h-7 w-7 text-[#5A2D2D]" />
            </div>

            <div>

              <h1 className="text-4xl font-serif text-[#4B2E2E]">
                Contact Page
              </h1>

              <p className="mt-2 text-[#7A6464]">
                Manage your business contact information and social links.
              </p>

            </div>

          </div>

          <Link
            href="/admin/content"
            className="flex items-center gap-2 rounded-xl border border-[#E8DED2] bg-white px-5 py-3 text-[#4B2E2E] transition hover:border-[#5A2D2D]"
          >
            <ArrowLeft size={18} />
            Back
          </Link>

        </div>
                <div className="rounded-3xl bg-white p-8 shadow-sm">

          <div className="grid gap-6">

            <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Business Address
              </label>

              <textarea
                rows={4}
                value={content.address}
                onChange={(e) =>
                  setContent({
                    ...content,
                    address: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

            </div>

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 block font-medium text-[#4B2E2E]">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={content.phone}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      phone: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium text-[#4B2E2E]">
                  Email Address
                </label>

                <input
                  type="email"
                  value={content.email}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                />

              </div>

            </div>

            <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Google Maps URL
              </label>

              <input
                type="url"
                value={content.google_maps_url}
                onChange={(e) =>
                  setContent({
                    ...content,
                    google_maps_url: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

            </div>
                        <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 block font-medium text-[#4B2E2E]">
                  Business Hours
                </label>

                <input
                  type="text"
                  value={content.business_hours}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      business_hours: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium text-[#4B2E2E]">
                  Instagram URL
                </label>

                <input
                  type="url"
                  value={content.instagram_url}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      instagram_url: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                />

              </div>

            </div>

          </div>

          <div className="mt-10 flex justify-end">

            <button
              type="button"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#5A2D2D] px-6 py-3 font-medium text-white transition hover:bg-[#432121] disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </div>
        </div>
    </div>
  );
}