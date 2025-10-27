"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

interface TrendingCategory {
  name: string;
  description: string;
}

export default function TrendingCarousel() {
  const [categories, setCategories] = useState<TrendingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        console.log("[TrendingCarousel] Fetching trending categories...");
        setLoading(true);
        const response = await apiClient.getTrendingCategories(7, 15);
        console.log("[TrendingCarousel] Received response:", response);
        setCategories(response.categories);
        setError(null);
      } catch (err) {
        console.error("[TrendingCarousel] Error fetching trending categories:", err);
        setError("Failed to load trending topics");
        // Set empty array on error
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="w-full mt-4">
        <h2 className="text-sm font-semibold text-gray-800 px-6 pb-2">
          Trending
        </h2>
        <div className="bg-gray-100 overflow-hidden py-2">
          <div className="flex gap-4 px-6 items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center w-32 flex-shrink-0"
              >
                <div className="bg-white rounded-lg shadow-sm p-2 mb-1 w-32 h-16 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div className="w-full mt-4">
        <h2 className="text-sm font-semibold text-gray-800 px-6 pb-2">
          Trending
        </h2>
        <div className="bg-gray-100 overflow-hidden py-2">
          <div className="flex gap-4 px-6 items-center">
            <p className="text-xs text-gray-500 italic">
              {error || "No trending topics yet. Start browsing to see trends!"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      <h2 className="text-sm font-semibold text-gray-800 px-6 pb-2">
        Trending in Your History
      </h2>
      <div className="bg-gray-100 overflow-hidden py-2">
        <div className="flex gap-4 animate-scroll items-center">
          {[...categories, ...categories].map((category, index) => (
            <div
              key={index}
              className="flex flex-col items-center w-36 flex-shrink-0"
            >
              <div className="bg-white rounded-lg shadow-sm p-3 mb-1 w-36 min-h-20 flex flex-col items-start justify-center">
                <span className="text-xs font-semibold text-gray-800 mb-1 line-clamp-2">
                  {category.name}
                </span>
                <span className="text-[10px] text-gray-600 line-clamp-2">
                  {category.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
