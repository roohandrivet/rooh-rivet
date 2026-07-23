"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Info } from "lucide-react";

type AboutContent = {
  heading: string;
  story: string;
  mission: string;
  vision: string;
  image_url: string;
};

export default function AboutContentPage() {
  const [loading] = useState(false);

  const [content, setContent] = useState<AboutContent>({
    heading: "",
    story: "",
    mission: "",
    vision: "",
    image_url: "",
  });

  return (
    <div className="min-h-screen bg-[#F8F4EF] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5E7E0]">
              <Info className="h-7 w-7 text-[#5A2D2D]" />
            </div>

            <div>

              <h1 className="text-4xl font-serif text-[#4B2E2E]">
                About Page
              </h1>

              <p className="mt-2 text-[#7A6464]">
                Edit your brand story, mission and company information.
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
                Page Heading
              </label>

              <input
                type="text"
                value={content.heading}
                onChange={(e) =>
                  setContent({
                    ...content,
                    heading: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

            </div>

            <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Brand Story
              </label>

              <textarea
                rows={6}
                value={content.story}
                onChange={(e) =>
                  setContent({
                    ...content,
                    story: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

            </div>

            <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Mission
              </label>

              <textarea
                rows={4}
                value={content.mission}
                onChange={(e) =>
                  setContent({
                    ...content,
                    mission: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

            </div>
                        <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Vision
              </label>

              <textarea
                rows={4}
                value={content.vision}
                onChange={(e) =>
                  setContent({
                    ...content,
                    vision: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
              />

            </div>

            <div>

              <label className="mb-2 block font-medium text-[#4B2E2E]">
                Brand Image URL
              </label>

              <input
                type="text"
                value={content.image_url}
                onChange={(e) =>
                  setContent({
                    ...content,
                    image_url: e.target.value,
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