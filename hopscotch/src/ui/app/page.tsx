import Image from "next/image";

const trendingTopics = [
  { name: "Wet Look Lashes", image: "/trending/Wet Look Lashes.png" },
  { name: "Japanese Head Spa", image: "/trending/Japanese Head Spa.png" },
  { name: "Creatine Gummies", image: "/trending/Creatine Gummies.png" },
  { name: "Malatang", image: "/trending/Malatang.png" },
  { name: "Tallow Cream", image: "/trending/Tallow Cream.png" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="w-full h-24 bg-white border-b border-gray-200 flex items-center px-6">
        <Image
          src="/hopscotch_logo.png"
          alt="Hopscotch Logo"
          width={80}
          height={80}
          className="h-20 w-auto"
          priority
        />
      </nav>

      <div className="flex flex-col items-center pt-8">
        {/* Header Image */}
        <div className="w-80 h-52 relative">
          <Image
            src="/amangeldi_header.png"
            alt="Header"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Trending Topics Carousel */}
        <div className="w-full mt-8 overflow-hidden bg-gray-100 py-4">
          <div className="flex gap-4 animate-scroll items-start">
            {[...trendingTopics, ...trendingTopics].map((topic, index) => (
              <div
                key={index}
                className="flex flex-col items-center w-32 flex-shrink-0"
              >
                <div className="bg-white rounded-lg shadow-sm p-3 mb-2 h-28 flex flex-col items-center justify-start">
                  <div className="relative w-16 h-16 mb-2">
                    <Image
                      src={topic.image}
                      alt={topic.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center block">
                    {topic.name}
                  </span>
                </div>
                <div className="relative w-full h-10">
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
    </main>
  );
}
