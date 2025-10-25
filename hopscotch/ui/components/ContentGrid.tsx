import Image from 'next/image';
import { GRID_SIZE, GRID_COLUMNS } from '@/constants/navigationSearch';

export interface ContentItem {
  id: number;
  imageUrl?: string;
  title?: string;
}

interface ContentGridProps {
  items: ContentItem[];
  onItemClick?: (index: number) => void;
}

export default function ContentGrid({ items, onItemClick }: ContentGridProps) {
  const gridItems = Array.from({ length: GRID_SIZE }, (_, i) => items[i] || { id: i });

  return (
    <div className="w-full max-w-md mx-auto px-6 py-2">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}
      >
        {gridItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onItemClick?.(index)}
            className="aspect-square bg-gray-200 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title || `Content ${index + 1}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-2xl">{index + 1}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
}
