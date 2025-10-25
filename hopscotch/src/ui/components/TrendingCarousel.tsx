import Image from "next/image";

const trendingTopics = [
  { name: "Wet Look Lashes", image: "/trending/Wet Look Lashes.png" },
  { name: "Japanese Head Spa", image: "/trending/Japanese Head Spa.png" },
  { name: "Creatine Gummies", image: "/trending/Creatine Gummies.png" },
  { name: "Malatang", image: "/trending/Malatang.png" },
  { name: "Tallow Cream", image: "/trending/Tallow Cream.png" },
];

export default function TrendingCarousel() {
  return (
    <div className="w-full mt-4">
      <h2 className="text-sm font-semibold text-gray-800 px-6 pb-2">
        Trending
      </h2>
      <div className="bg-gray-100 overflow-hidden py-2">
        <div className="flex gap-4 animate-scroll items-center">
        {[...trendingTopics, ...trendingTopics].map((topic, index) => (
          <div
            key={index}
            className="flex flex-col items-center w-32 flex-shrink-0"
          >
            <div className="bg-white rounded-lg shadow-sm p-2 mb-1 w-32 h-16 flex flex-col items-center justify-center">
              <div className="relative w-8 h-8 flex-shrink-0 mb-1">
                <Image
                  src={topic.image}
                  alt={topic.name}
                  fill
                  className="object-contain rounded"
                />
              </div>
              <span className="text-[10px] font-medium text-gray-700 text-center block leading-tight line-clamp-2 w-full">
                {topic.name}
              </span>
            </div>
            <div className="relative w-32 h-5 flex-shrink-0">
              <Image
                src="/topic_heatmap.png"
                alt="Topic heatmap"
                fill
                className="object-contain"
              />
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
