"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Home } from "lucide-react";

type HomeContent = {
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_link: string;
  featured_heading: string;
  featured_description: string;
};

export default function HomeContentPage() {
  const [loading] = useState(false);

  const [content, setContent] = useState<HomeContent>({
    hero_title: "",
    hero_subtitle: "",
    hero_button_text: "",
    hero_button_link: "",
    featured_heading: "",
    featured_description: "",
  });

  return (
    <div className="min-h-screen bg-[#F8F4EF] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5E7E0]">
              <Home className="h-7 w-7 text-[#5A2D2D]" />
            </div>

            <div>

              <h1 className="text-4xl font-serif text-[#4B2E2E]">
                Homepage Content
              </h1>

              <p className="mt-2 text-[#7A6464]">
                Update the homepage without touching any code.
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
      Hero Title
    </label>

    <input
      type="text"
      value={content.hero_title}
      onChange={(e) =>
        setContent({
          ...content,
          hero_title: e.target.value,
        })
      }
      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
    />

  </div>

  <div>

    <label className="mb-2 block font-medium text-[#4B2E2E]">
      Hero Subtitle
    </label>

    <textarea
      rows={4}
      value={content.hero_subtitle}
      onChange={(e) =>
        setContent({
          ...content,
          hero_subtitle: e.target.value,
        })
      }
      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
    />

  </div>

  <div className="grid gap-6 md:grid-cols-2">

    <div>

      <label className="mb-2 block font-medium text-[#4B2E2E]">
        Hero Button Text
      </label>

      <input
        type="text"
        value={content.hero_button_text}
        onChange={(e) =>
          setContent({
            ...content,
            hero_button_text: e.target.value,
          })
        }
        className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
      />

    </div>

    <div>

      <label className="mb-2 block font-medium text-[#4B2E2E]">
        Hero Button Link
      </label>

      <input
        type="text"
        value={content.hero_button_link}
        onChange={(e) =>
          setContent({
            ...content,
            hero_button_link: e.target.value,
          })
        }
        className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
      />

    </div>

  </div>
              <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Featured Collection Heading
              </label>

              <input
                type="text"
                value={content.featured_heading}
                onChange={(e) =>
                  setContent({
                    ...content,
                    featured_heading: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

            </div>

            <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Featured Collection Description
              </label>

              <textarea
                rows={5}
                value={content.featured_description}
                onChange={(e) =>
                  setContent({
                    ...content,
                    featured_description: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

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