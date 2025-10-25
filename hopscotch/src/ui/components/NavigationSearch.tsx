'use client';

import { useState } from 'react';
import SearchInput from './SearchInput';
import ContentGrid, { ContentItem } from './ContentGrid';
import ContentControls from './ContentControls';
import { ControlButton, HARDCODED_IMAGES } from '@/constants/navigationSearch';

export default function NavigationSearch() {
  const [searchValue, setSearchValue] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (searchValue.trim()) {
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
            <ContentGrid
              items={contentItems}
              onItemClick={handleItemClick}
            />
            <ContentControls onControlClick={handleControlClick} />
          </>
        )}
      </div>

      {/* Fixed bottom search bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10" style={{ paddingRight: 'var(--hopscotch-width)' }}>
        <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleSearch}
        />
      </div>
    </>
  );
}
