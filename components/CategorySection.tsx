"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

// Dummy categories — replace with API call when backend is ready
// image: real category image uploaded by admin
// defaultImage: fallback if no image uploaded
const LIVE_CATEGORIES = [
  {
    id: "sports",
    name: "Sports",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80",
    defaultImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
  },
  {
    id: "chess",
    name: "Chess",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&q=80",
    defaultImage: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&q=80",
  },
  {
    id: "dance",
    name: "Dance",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    defaultImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
  },
  {
    id: "swimming",
    name: "Swimming",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&q=80",
    defaultImage: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&q=80",
  },
  {
    id: "music",
    name: "Music",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    defaultImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
  },
  {
    id: "art",
    name: "Art",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
    defaultImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
  },
];

const DEFAULT_CITY = "chennai";

export default function CategorySection() {
  const router = useRouter();

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/events?category=${categoryId}&city=${DEFAULT_CITY}`);
  };

  return (
    <section className="w-full bg-white border-b border-gray-100 py-5">

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 mb-4">
        <h2 className="text-sm md:text-base font-bold text-blue-900">Browse by Category</h2>
        <a href="/events" className="text-xs md:text-sm text-blue-600 font-semibold hover:underline">
          View All →
        </a>
      </div>

      {/* ── Horizontal Scroll Carousel ── */}
      <div className="px-4 md:px-8 overflow-x-auto no-scrollbar">
        <div
          className="flex gap-3"
          style={{
            width: LIVE_CATEGORIES.length === 1 ? "100%" : "max-content",
          }}
        >
          {LIVE_CATEGORIES.map((cat) => {
            const imgSrc = cat.image || cat.defaultImage;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex flex-col items-center rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-md hover:border-blue-200 transition active:scale-95 flex-shrink-0
                  ${LIVE_CATEGORIES.length === 1 ? "w-full" : "w-28 md:w-36"}
                `}
              >
                {/* Image */}
                <div className="w-full h-24 md:h-32 relative overflow-hidden bg-gray-100">
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-300"
                    onError={(e) => {
                      // fallback to default image if load fails
                      (e.target as HTMLImageElement).src = cat.defaultImage;
                    }}
                  />
                </div>

                {/* Name */}
                <div className="w-full px-2 py-2 text-center">
                  <p className="text-xs md:text-sm font-semibold text-blue-900">{cat.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </section>
  );
}
