import { ImagePlus, Upload } from "lucide-react";

export default function MediaPage() {
  return (
    <div className="space-y-10">

      {/* Header */}

      <div>

        <h1 className="font-serif text-5xl text-[#5A2D2D]">
          Media Library
        </h1>

        <p className="mt-2 text-[#8B6B5B]">
          Upload and manage your product images and banners.
        </p>

      </div>

      {/* Upload Box */}

      <div className="rounded-3xl border-2 border-dashed border-[#DCCBC0] bg-white p-12 text-center">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F8F4EF]">

          <Upload
            size={34}
            className="text-[#5A2D2D]"
          />

        </div>

        <h2 className="mt-6 font-serif text-3xl text-[#5A2D2D]">
          Upload Images
        </h2>

        <p className="mt-3 text-[#8B6B5B]">
          Drag & drop images here or choose files from your computer.
        </p>

        <button className="mt-8 rounded-full bg-[#5A2D2D] px-8 py-4 text-white transition hover:bg-[#472323]">
          Choose Files
        </button>

      </div>

      {/* Gallery */}

      <div>

        <h2 className="mb-6 font-serif text-3xl text-[#5A2D2D]">
          Uploaded Images
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (

            <div
              key={item}
              className="overflow-hidden rounded-3xl border border-[#E8DDD3] bg-white shadow-sm"
            >

              <div className="flex h-52 items-center justify-center bg-[#F8F4EF]">

                <ImagePlus
                  size={48}
                  className="text-[#B79D90]"
                />

              </div>

              <div className="p-5">

                <p className="truncate font-medium text-[#5A2D2D]">
                  image-{item}.jpg
                </p>

                <p className="mt-1 text-sm text-[#8B6B5B]">
                  1024 × 1024
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}