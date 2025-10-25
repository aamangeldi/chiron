import Image from "next/image";
import Hopscotch from "@/components/Hopscotch";
import TrendingCarousel from "@/components/TrendingCarousel";

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

      <div className="flex flex-col items-center pt-1 pb-1" style={{ paddingRight: 'var(--hopscotch-width)' }}>
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
        <TrendingCarousel />
      </div>

      {/* Fixed Right Sidebar Overlay with Hopscotch */}
      <aside className="fixed top-24 right-0 h-[calc(100vh-6rem)] bg-gradient-to-b from-blue-50 to-purple-50 border-l border-gray-200 overflow-y-auto shadow-2xl" style={{ width: 'var(--hopscotch-width)' }}>
        <Hopscotch />
      </aside>
    </main>
  );
}
