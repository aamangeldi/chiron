'use client';

import { useState } from 'react';
import Image from "next/image";
import Hopscotch from "@/components/Hopscotch";
import TrendingCarousel from "@/components/TrendingCarousel";
import NavigationSearch, { SearchResult } from "@/components/NavigationSearch";
import { apiClient } from "@/lib/api";

export default function Home() {
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [scrollToSearchId, setScrollToSearchId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSearchHistoryChange = (searches: SearchResult[]) => {
    setSearchHistory(searches);
  };

  const handleSearchClick = (searchId: string) => {
    setScrollToSearchId(searchId);
    // Reset after scrolling
    setTimeout(() => setScrollToSearchId(null), 500);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient.startFullSync();
      alert("History sync started! This may take a few seconds...");
      // Refresh the page after a short delay to show new data
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Failed to sync history. Please check that the backend is running.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 w-full h-24 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
        <Image
          src="/hopscotch_logo.png"
          alt="Hopscotch Logo"
          width={80}
          height={80}
          className="h-20 w-auto"
          priority
        />
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {syncing ? "Syncing..." : "Sync History"}
        </button>
      </nav>

      <div className="flex flex-col items-center pt-24 pb-20" style={{ paddingRight: 'var(--hopscotch-width)' }}>
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

        {/* Navigation Search */}
        <NavigationSearch
          onSearchHistoryChange={handleSearchHistoryChange}
          scrollToSearchId={scrollToSearchId}
        />
      </div>

      {/* Fixed Right Sidebar Overlay with Hopscotch */}
      <aside className="fixed top-24 right-0 bottom-0 bg-gradient-to-b from-blue-50 to-purple-50 border-l border-gray-200 overflow-y-auto shadow-2xl" style={{ width: 'var(--hopscotch-width)' }}>
        <Hopscotch
          searchHistory={searchHistory}
          onSearchClick={handleSearchClick}
        />
      </aside>
    </main>
  );
}
