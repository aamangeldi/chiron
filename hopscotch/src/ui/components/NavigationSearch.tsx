'use client';

import { useState, useRef, useEffect } from 'react';
import SearchInput from './SearchInput';
import ContentGrid, { ContentItem } from './ContentGrid';
import ContentControls from './ContentControls';
import { ControlButton, ControlType, HARDCODED_IMAGES } from '@/constants/navigationSearch';

export interface SearchResult {
  id: string;
  query: string;
  items: ContentItem[];
  timestamp: number;
  groupKey?: string; // used to horizontally group variations from the same image
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

  const handleSearch = (overrideQuery?: string, groupKey?: string) => {
    const queryToRun = (overrideQuery ?? searchValue).trim();
    if (queryToRun) {
      setLastSearchValue(queryToRun);

      const newSearch: SearchResult = {
        id: `search-${Date.now()}`,
        query: queryToRun,
        items: HARDCODED_IMAGES.map((imageUrl, index) => ({
          id: index,
          imageUrl,
          title: `Option ${index + 1}`,
        })),
        timestamp: Date.now(),
        groupKey,
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

  // groupKey denotes the exact parent block id; all children of the same parent share a row

  const handleItemClick = (index: number) => {
    console.log('Content item clicked:', index);
  };

  const handleControlClick = (button: ControlButton, fromSearch: SearchResult) => {
    if (button.type === ControlType.SMALL_VARIATION || button.type === ControlType.LARGE_VARIATION) {
      // Use the exact parent block id as the row key
      handleSearch(fromSearch.query, fromSearch.id);
      return;
    }

    if (button.type === ControlType.REROLL) {
      handleRedo();
      return;
    }

    // OPEN_TABS and other controls can be handled here as needed
    console.log('Control clicked:', button);
  };

  return (
    <>
      {/* Results area */}
      <div className="w-full py-4">
        {(() => {
          // Build rows: same groupKey items share a horizontal row
          const rows: { key: string; items: SearchResult[] }[] = [];
          const rowIndexByKey: { [key: string]: number } = {};

          for (const s of searchHistory) {
            const key = s.groupKey ?? `single-${s.id}`;
            if (rowIndexByKey[key] === undefined) {
              rowIndexByKey[key] = rows.length;
              rows.push({ key, items: [s] });
            } else {
              rows[rowIndexByKey[key]].items.push(s);
            }
          }

          return rows.map((row) => (
            <div key={row.key} className="mb-8">
              {row.items.length === 1 && !row.key.startsWith('single-') ? null : null}
              {row.items.length === 1 ? (
                <div
                  ref={(el) => { searchRefs.current[row.items[0].id] = el; }}
                >
                  <div className="w-full max-w-md mx-auto px-6 pb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Search:</span> {row.items[0].query}
                    </p>
                  </div>
                  <ContentGrid items={row.items[0].items} onItemClick={handleItemClick} />
                  <div className="w-full max-w-md mx-auto px-6 pt-2">
                    <ContentControls onControlClick={(button) => handleControlClick(button, row.items[0])} />
                  </div>
                </div>
              ) : (
                <div className="px-6">
                  {(() => {
                    const chunks: SearchResult[][] = [];
                    for (let i = 0; i < row.items.length; i += 3) {
                      chunks.push(row.items.slice(i, i + 3));
                    }
                    return chunks.map((chunk, ci) => (
                      <div key={`${row.key}-chunk-${ci}`} className="flex w-full justify-center gap-4 pb-2">
                        {chunk.map((item) => (
                          <div
                            key={item.id}
                            ref={(el) => { searchRefs.current[item.id] = el; }}
                            className="flex-none w-[20rem]"
                          >
                            <div className="pb-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Search:</span> {item.query}
                              </p>
                            </div>
                            <ContentGrid items={item.items} onItemClick={handleItemClick} compact />
                            <div className="pt-2">
                              <ContentControls onControlClick={(button) => handleControlClick(button, item)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          ));
        })()}
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
