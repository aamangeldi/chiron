'use client';

import { useState, useRef, useEffect } from 'react';
import SearchInput from './SearchInput';
import ContentGrid from './ContentGrid';
import ContentControls from './ContentControls';
import { ControlButton } from '@/constants/navigationSearch';
import { apiClient, SearchTile, ActionType } from '@/lib/api';

export interface SearchSession {
  id: string;
  query: string;
  sessionId: string;
  hop: number;
  tiles: SearchTile[];
  selectedIndex: number | null;
  timestamp: number;
  action?: ActionType;
  actionLabel?: string;
}

interface NavigationSearchProps {
  onSearchHistoryChange?: (searches: SearchSession[]) => void;
  scrollToSearchId?: string | null;
}

export default function NavigationSearch({ onSearchHistoryChange, scrollToSearchId }: NavigationSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchSession[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentSession, setCurrentSession] = useState<SearchSession | null>(null);
  const searchRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to a search when scrollToSearchId changes
  useEffect(() => {
    if (scrollToSearchId && searchRefs.current[scrollToSearchId]) {
      searchRefs.current[scrollToSearchId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToSearchId]);

  const performNavigation = async (
    query: string,
    action: ActionType,
    selectedIndex?: number,
    sessionId?: string
  ) => {
    setIsNavigating(true);

    try {
      console.log(`[NavigationSearch] Navigating: action=${action}, query=${query}, selectedIndex=${selectedIndex}`);

      const response = await apiClient.navigate({
        query,
        action,
        selected_index: selectedIndex,
        session_id: sessionId,
      });

      console.log(`[NavigationSearch] Navigation response: hop=${response.hop}, tiles=${response.tiles.length}`);

      // Generate action label
      let actionLabel = '';
      if (action === 'initial') {
        actionLabel = 'Initial search';
      } else if (action === 'vary_small' && selectedIndex !== undefined) {
        actionLabel = `Small variation from tile ${selectedIndex + 1}`;
      } else if (action === 'vary_large' && selectedIndex !== undefined) {
        actionLabel = `Large variation from tile ${selectedIndex + 1}`;
      } else if (action === 'reroll') {
        actionLabel = 'Reroll (new options)';
      } else if (action === 'pick' && selectedIndex !== undefined) {
        actionLabel = `Exploring tile ${selectedIndex + 1}`;
      }

      const newSession: SearchSession = {
        id: `search-${Date.now()}`,
        query,
        sessionId: response.session_id,
        hop: response.hop,
        tiles: response.tiles,
        selectedIndex: selectedIndex ?? null,
        timestamp: Date.now(),
        action,
        actionLabel,
      };

      // Always add as a new grid entry (never replace)
      const updatedHistory = [...searchHistory, newSession];
      setSearchHistory(updatedHistory);
      setCurrentSession(newSession);
      onSearchHistoryChange?.(updatedHistory);

      // Auto-scroll to new grid
      setTimeout(() => {
        searchRefs.current[newSession.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

    } catch (error) {
      console.error("[NavigationSearch] Navigation error:", error);

      // Show error message to user
      const errorSession: SearchSession = {
        id: `search-${Date.now()}`,
        query,
        sessionId: '',
        hop: 0,
        tiles: [
          {
            url: '',
            title: 'Error',
            description: `Failed to navigate: ${error}. Please make sure the backend is running.`,
            domain: '',
            image_url: null,
            score: 0,
            score_breakdown: {},
          },
          { url: '', title: 'No results', description: 'Try again', domain: '', image_url: null, score: 0, score_breakdown: {} },
          { url: '', title: 'No results', description: 'Try again', domain: '', image_url: null, score: 0, score_breakdown: {} },
          { url: '', title: 'No results', description: 'Try again', domain: '', image_url: null, score: 0, score_breakdown: {} },
        ],
        selectedIndex: null,
        timestamp: Date.now(),
      };

      const updatedHistory = [...searchHistory, errorSession];
      setSearchHistory(updatedHistory);
      onSearchHistoryChange?.(updatedHistory);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleSearch = async () => {
    if (searchValue.trim() && !isNavigating) {
      await performNavigation(searchValue, 'initial');
    }
  };

  const handleTileClick = (sessionId: string, index: number) => {
    // Tiles now open URLs directly via ContentGrid
    // Just update visual selection for reference
    const updatedHistory = searchHistory.map(s =>
      s.id === sessionId ? { ...s, selectedIndex: index } : s
    );
    setSearchHistory(updatedHistory);
    console.log(`[NavigationSearch] Tile ${index} selected (opened in new tab)`);
  };

  const handleControlClick = (button: ControlButton, sessionId: string) => {
    const session = searchHistory.find(s => s.id === sessionId);
    if (!session || isNavigating) return;

    console.log(`[NavigationSearch] Control clicked: button=${button.label}, session=${sessionId}`);

    const { type, gridIndex } = button;

    // Handle open tabs - open all 4 tiles in new tabs
    if (type === 'open_tabs') {
      session.tiles.forEach((tile) => {
        if (tile.url) {
          window.open(tile.url, '_blank', 'noopener,noreferrer');
        }
      });
      console.log(`[NavigationSearch] Opened ${session.tiles.filter(t => t.url).length} tabs`);
      return;
    }

    // Map button type to action
    let action: ActionType;
    if (type === 'small_variation') {
      action = 'vary_small';
    } else if (type === 'large_variation') {
      action = 'vary_large';
    } else if (type === 'reroll') {
      action = 'reroll';
      // Reroll doesn't need an index
      performNavigation(session.query, action, undefined, session.sessionId);
      return;
    } else {
      return;
    }

    // Perform variation with the tile index
    performNavigation(session.query, action, gridIndex, session.sessionId);
  };

  return (
    <>
      {/* Results area */}
      <div className="w-full py-4 pb-24">
        {searchHistory.map((session) => (
          <div
            key={session.id}
            ref={(el) => (searchRefs.current[session.id] = el)}
            className="mb-8"
          >
            {/* Display search query and hop counter */}
            <div className="w-full max-w-2xl mx-auto px-6 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Search:</span> {session.query}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-gray-500 font-mono">
                    Hop {session.hop}
                  </p>
                  <div className="group relative">
                    <svg
                      className="w-3.5 h-3.5 text-gray-400 cursor-help"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-blue-300 mb-2">How to navigate:</p>
                        <p><strong>Click a tile</strong> → Opens that page</p>
                        <p><strong>S1-S4</strong> → Small variations</p>
                        <p><strong>L1-L4</strong> → Large variations</p>
                        <p><strong>🔄 Reroll</strong> → Fresh options</p>
                        <p><strong>⧉ Open Tabs</strong> → Open all 4</p>
                      </div>
                      {/* Arrow */}
                      <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>
              {session.actionLabel && (
                <p className="text-xs text-blue-600 font-medium">
                  {session.actionLabel}
                </p>
              )}
            </div>

            {/* Loading indicator */}
            {isNavigating && session.id === searchHistory[searchHistory.length - 1]?.id && (
              <div className="w-full max-w-2xl mx-auto px-6 py-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Navigating search space...</span>
                </div>
              </div>
            )}

            <ContentGrid
              tiles={session.tiles}
              onTileClick={(index) => handleTileClick(session.id, index)}
              selectedIndex={session.selectedIndex}
            />

            <div className="w-full max-w-2xl mx-auto px-6 pt-2">
              <ContentControls
                onControlClick={(button) => handleControlClick(button, session.id)}
                disabled={isNavigating}
              />
            </div>
          </div>
        ))}

        {/* Empty state */}
        {searchHistory.length === 0 && !isNavigating && (
          <div className="w-full max-w-2xl mx-auto px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Discover through Navigation
            </h2>
            <p className="text-gray-600 mb-6">
              Search to start exploring. Navigate through 4 options at each hop to discover new content.
            </p>
            <div className="text-sm text-gray-500 space-y-2">
              <p>🔗 <strong>Click a tile</strong> to open that page in a new tab</p>
              <p>🔍 <strong>S1-S4 buttons</strong> for small variations around each tile</p>
              <p>🎲 <strong>L1-L4 buttons</strong> for large variations (explore alternatives)</p>
              <p>🔄 <strong>Reroll</strong> for completely fresh options</p>
              <p>⧉ <strong>Open Tabs</strong> to open all 4 results at once</p>
            </div>
          </div>
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
              disabled={isNavigating}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchValue.trim() || isNavigating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors text-sm font-medium"
            title="Start new search"
          >
            {isNavigating ? '...' : 'Go'}
          </button>
        </div>
      </div>
    </>
  );
}
