'use client';

import Image from 'next/image';
import { SearchResult } from './NavigationSearch';

interface HopscotchProps {
  searchHistory?: SearchResult[];
  onSearchClick?: (searchId: string) => void;
}

const HOPSCOTCH_IMAGES = [
  '/hopscotch_boxes/hopscotch_1.png',
  '/hopscotch_boxes/hopscotch_2.png',
  '/hopscotch_boxes/hopscotch_3.png',
  '/hopscotch_boxes/hopscotch_4.png',
];

export default function Hopscotch({ searchHistory = [], onSearchClick }: HopscotchProps) {
  const getHopscotchImage = (index: number) => {
    return HOPSCOTCH_IMAGES[index % HOPSCOTCH_IMAGES.length];
  };

  return (
    <div className="h-full flex flex-col items-center justify-start pt-8 px-2 gap-4">
      {searchHistory.length === 0 ? (
        /* Default box when no searches */
        <button className="relative w-16 h-16 cursor-pointer transition-transform hover:scale-110 hover:brightness-110">
          <Image
            src="/hopscotch_boxes/hopscotch_1.png"
            alt="Hopscotch box 1"
            fill
            className="object-contain"
          />
        </button>
      ) : (
        /* Display search history */
        searchHistory.map((search, index) => (
          <button
            key={search.id}
            onClick={() => onSearchClick?.(search.id)}
            className="relative w-16 h-16 cursor-pointer transition-transform hover:scale-110 hover:brightness-110"
            title={search.query}
          >
            <Image
              src={getHopscotchImage(index)}
              alt={`Search: ${search.query}`}
              fill
              className="object-contain"
            />
          </button>
        ))
      )}
    </div>
  );
}
