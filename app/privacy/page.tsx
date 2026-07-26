import type {
  Metadata,
} from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy information for Rooh & Rivet.",
  alternates: {
    canonical:
      "https://www.roohandrivet.com/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EF] px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5A2D2D] transition hover:text-[#8B6B5B]"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <section className="mt-8 overflow-hidden rounded-[32px] border border-[#E8DDD3] bg-white shadow-sm">
          <div className="border-b border-[#E8DDD3] bg-[#FCF8F4] px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8E0]">
              <ShieldCheck
                size={27}
                className="text-[#5A2D2D]"
              />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-[#8B6B5B]">
              Legal Information
            </p>

            <h1 className="mt-4 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Privacy Policy
            </h1>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="font-semibold">
                Privacy policy content has not yet been published.
              </p>

              <p className="mt-2 text-sm leading-6">
                This temporary page prevents broken links while the approved
                legal wording is being prepared. It is not a substitute for a
                complete privacy policy.
              </p>
            </div>

            <div className="mt-10 space-y-6 text-[#6F5B55]">
              <p className="leading-8">
                Rooh &amp; Rivet will publish its approved privacy policy here
                before final production launch. The completed policy should
                explain how customer information is collected, used, stored,
                protected and shared.
              </p>

              <p className="leading-8">
                Until the approved policy is available, please avoid relying on
                this page as legal or compliance documentation.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-[#E8DDD3] bg-[#F8F4EF] p-6">
              <div className="flex items-start gap-3">
                <Mail
                  size={20}
                  className="mt-1 shrink-0 text-[#5A2D2D]"
                />

                <div>
                  <h2 className="font-serif text-2xl text-[#4B2E2E]">
                    Privacy Questions
                  </h2>

                  <p className="mt-2 leading-7 text-[#7A6464]">
                    Contact the store through the Contact page for questions
                    about personal information or data handling.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-4 inline-flex rounded-full bg-[#5A2D2D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#442020]"
                  >
                    Contact Rooh &amp; Rivet
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-10 text-center text-sm text-[#8B6B5B]">
              Last updated: Not yet published
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}