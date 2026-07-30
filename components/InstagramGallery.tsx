"use client";

import Script from "next/script";

const instagramPosts = [
  "https://www.instagram.com/reel/DZ127jKh0ro/",
  "https://www.instagram.com/reel/DaFZVu4hyF1/",
  "https://www.instagram.com/reel/DaBLNNmBPiR/",
  "https://www.instagram.com/reel/DZ8FsimSn5F/",
  "https://www.instagram.com/reel/DZ23Z80yysL/",
  "https://www.instagram.com/reel/DZz1cTGhpnv/",
];

export default function InstagramGallery() {
  return (
    <section className="bg-[#F8F4EF] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.32em] text-[#8B6B5B]">
            Follow Our Journey
          </p>

          <h2 className="font-serif text-3xl text-[#4B2E2E] sm:text-4xl lg:text-5xl">
            Rooh &amp; Rivet on Instagram
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6F5A50] sm:text-base">
            Discover our latest jewellery, styling inspiration and moments
            from the world of Rooh &amp; Rivet.
          </p>

          <a
            href="https://www.instagram.com/rooh.n.rivet/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex border-b border-[#5A2D2D] pb-1 text-sm font-medium tracking-wide text-[#5A2D2D] transition-opacity hover:opacity-70"
          >
            @rooh.n.rivet
          </a>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {instagramPosts.map((postUrl) => (
            <div
              key={postUrl}
              className="overflow-hidden rounded-2xl border border-[#E8DED5] bg-white p-2 shadow-[0_12px_40px_rgba(75,46,46,0.08)]"
            >
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={postUrl}
                data-instgrm-version="14"
                style={{
                  background: "#FFFFFF",
                  border: 0,
                  borderRadius: "12px",
                  boxShadow: "none",
                  margin: 0,
                  minWidth: "100%",
                  padding: 0,
                  width: "100%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="https://www.instagram.com/rooh.n.rivet/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#5A2D2D] px-8 py-3 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4B2525]"
          >
            View More on Instagram
          </a>
        </div>
      </div>

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.instgrm?.Embeds.process();
        }}
      />
    </section>
  );
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}