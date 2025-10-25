'use client';

import { useState } from 'react';
import SearchInput from './SearchInput';
import ContentGrid, { ContentItem } from './ContentGrid';
import ContentControls from './ContentControls';
import { ControlButton, HARDCODED_IMAGES } from '@/constants/navigationSearch';

export default function NavigationSearch() {
  const [searchValue, setSearchValue] = useState('');
  const [lastSearchValue, setLastSearchValue] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (searchValue.trim()) {
      setLastSearchValue(searchValue);
      setShowResults(true);
      // Use hardcoded images
      setContentItems(
        HARDCODED_IMAGES.map((imageUrl, index) => ({
          id: index,
          imageUrl,
          title: `Option ${index + 1}`,
        }))
      );
    }
  };

  const handleRedo = () => {
    if (lastSearchValue) {
      setSearchValue(lastSearchValue);
      handleSearch();
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
        {showResults && (
          <>
            {/* Display search query */}
            <div className="w-full max-w-md mx-auto px-6 pb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Search:</span> {lastSearchValue}
              </p>
            </div>

            <ContentGrid
              items={contentItems}
              onItemClick={handleItemClick}
            />

            <div className="w-full max-w-md mx-auto px-6 pt-2">
              <ContentControls onControlClick={handleControlClick} />
            </div>
          </>
        )}
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
