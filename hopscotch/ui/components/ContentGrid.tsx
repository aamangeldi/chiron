'use client';

import { SearchTile } from '@/lib/api';
import { GRID_SIZE, GRID_COLUMNS } from '@/constants/navigationSearch';

interface ContentGridProps {
  tiles: SearchTile[];
  onTileClick?: (index: number) => void;
  selectedIndex?: number | null;
}

const getDomainColor = (domain: string): string => {
  // Generate a consistent color based on TLD
  const tld = domain.split('.').pop() || 'com';
  const colors: Record<string, string> = {
    'com': 'bg-blue-100 text-blue-700',
    'org': 'bg-green-100 text-green-700',
    'net': 'bg-purple-100 text-purple-700',
    'edu': 'bg-yellow-100 text-yellow-700',
    'gov': 'bg-red-100 text-red-700',
    'io': 'bg-indigo-100 text-indigo-700',
    'co': 'bg-pink-100 text-pink-700',
  };
  return colors[tld] || 'bg-gray-100 text-gray-700';
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export default function ContentGrid({ tiles, onTileClick, selectedIndex }: ContentGridProps) {
  // Pad tiles to ensure exactly 4 items
  const gridTiles: (SearchTile | null)[] = Array.from({ length: GRID_SIZE }, (_, i) => tiles[i] || null);

  const handleTileClick = (tile: SearchTile | null, index: number) => {
    if (!tile) return;

    // If tile has a URL, open it in a new tab
    if (tile.url) {
      window.open(tile.url, '_blank', 'noopener,noreferrer');
    }

    // Also trigger callback for selection tracking
    onTileClick?.(index);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-2">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}
      >
        {gridTiles.map((tile, index) => (
          <div
            key={index}
            onClick={() => handleTileClick(tile, index)}
            className={`
              aspect-square bg-white rounded-lg border-2 overflow-hidden
              transition-all duration-200
              ${tile && tile.url ? 'cursor-pointer hover:shadow-lg hover:scale-105 border-gray-200 hover:border-blue-400' : 'border-gray-100'}
              ${selectedIndex === index ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            `}
          >
            {tile ? (
              <div className="w-full h-full flex flex-col overflow-hidden">
                {/* Image section - top half */}
                {tile.image_url ? (
                  <div className="w-full h-1/2 bg-gray-100 relative flex-shrink-0">
                    <img
                      src={tile.image_url}
                      alt={tile.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image container if fails to load
                        e.currentTarget.parentElement!.style.display = 'none';
                      }}
                    />
                    {/* Domain badge overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                      {tile.domain && (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${tile.domain}&sz=16`}
                          alt=""
                          className="w-3 h-3"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                        {truncateText(tile.domain || '', 15)}
                      </span>
                    </div>
                  </div>
                ) : (
                  // No image - show domain badge
                  <div className="px-3 pt-3 pb-1 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {tile.domain && (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${tile.domain}&sz=16`}
                          alt=""
                          className="w-4 h-4"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span
                        className={`
                          text-xs px-2 py-0.5 rounded-full font-medium truncate flex-1
                          ${getDomainColor(tile.domain || '')}
                        `}
                      >
                        {truncateText(tile.domain || 'unknown', 20)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content section - bottom half */}
                <div className={`flex-1 p-3 flex flex-col ${tile.image_url ? 'pt-2' : 'pt-1'}`}>
                  {/* Title with link indicator */}
                  <h3 className="text-sm font-bold text-gray-800 mb-1.5 line-clamp-2 flex-shrink-0 flex items-start gap-1">
                    <span className="flex-1">{truncateText(tile.title, 60)}</span>
                    {tile.url && (
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs text-gray-600 flex-1 ${tile.image_url ? 'line-clamp-3' : 'line-clamp-4'}`}>
                    {tile.description}
                  </p>

                  {/* Score indicator (optional, subtle) */}
                  {tile.score > 0 && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all"
                          style={{ width: `${Math.min(100, tile.score * 10)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{tile.score.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Empty placeholder
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="text-4xl font-light">{index + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
