'use client';

import { useState, useRef, useEffect } from 'react';
import SearchInput from './SearchInput';
import ContentGrid, { ContentItem } from './ContentGrid';
import ContentControls from './ContentControls';
import { ControlButton, HARDCODED_IMAGES } from '@/constants/navigationSearch';

export interface SearchResult {
  id: string;
  query: string;
  items: ContentItem[];
  timestamp: number;
}

interface NavigationSearchProps {
  onSearchHistoryChange?: (searches: SearchResult[]) => void;
  scrollToSearchId?: string | null;
}

export default function NavigationSearch({ onSearchHistoryChange, scrollToSearchId }: NavigationSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [lastSearchValue, setLastSearchValue] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const searchRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to a search when scrollToSearchId changes
  useEffect(() => {
    if (scrollToSearchId && searchRefs.current[scrollToSearchId]) {
      searchRefs.current[scrollToSearchId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToSearchId]);

  const handleSearch = () => {
    if (searchValue.trim()) {
      setLastSearchValue(searchValue);

      const newSearch: SearchResult = {
        id: `search-${Date.now()}`,
        query: searchValue,
        items: HARDCODED_IMAGES.map((imageUrl, index) => ({
          id: index,
          imageUrl,
          title: `Option ${index + 1}`,
        })),
        timestamp: Date.now(),
      };

      const updatedHistory = [...searchHistory, newSearch];
      setSearchHistory(updatedHistory);

      // Notify parent about search history change
      onSearchHistoryChange?.(updatedHistory);

      // Auto-scroll to the new search after a brief delay to let it render
      setTimeout(() => {
        searchRefs.current[newSearch.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleRedo = () => {
    if (lastSearchValue) {
      setSearchValue(lastSearchValue);
      setTimeout(() => handleSearch(), 0);
    }
  };

  const handleItemClick = (index: number) => {
    console.log('Content item clicked:', index);
  };

  const handleControlClick = (button: ControlButton) => {
    console.log('Control clicked:', button);
  };

  return (
    <>
      {/* Results area */}
      <div className="w-full py-4">
        {searchHistory.map((search) => (
          <div
            key={search.id}
            ref={(el) => (searchRefs.current[search.id] = el)}
            className="mb-8"
          >
            {/* Display search query */}
            <div className="w-full max-w-md mx-auto px-6 pb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Search:</span> {search.query}
              </p>
            </div>

            <ContentGrid
              items={search.items}
              onItemClick={handleItemClick}
            />

            <div className="w-full max-w-md mx-auto px-6 pt-2">
              <ContentControls onControlClick={handleControlClick} />
            </div>
          </div>
        ))}
      </div>

      {/* Fixed bottom search bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10" style={{ paddingRight: 'var(--hopscotch-width)' }}>
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex-1">
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              onSubmit={handleSearch}
            />
          </div>
          <button
            onClick={handleRedo}
            disabled={!lastSearchValue}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors text-lg"
            title="Redo last search"
          >
            ↻
          </button>
        </div>
      </div>
    </>
  );
}
