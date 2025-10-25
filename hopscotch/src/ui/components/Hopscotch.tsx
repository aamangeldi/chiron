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
  '/hopscotch_boxes/hopscotch_5.png',
  '/hopscotch_boxes/hopscotch_6.png',
  '/hopscotch_boxes/hopscotch_7.png',
  '/hopscotch_boxes/hopscotch_8.png',
  '/hopscotch_boxes/hopscotch_9.png',

];

export default function Hopscotch({ searchHistory = [], onSearchClick }: HopscotchProps) {
  const getHopscotchImage = (index: number) => {
    return HOPSCOTCH_IMAGES[index % HOPSCOTCH_IMAGES.length];
  };

  // Group rows by origin and depth (derived from groupKey: `${originId}__${depth}`)
  const rows: { key: string; items: SearchResult[] }[] = [];
  const rowIndexByKey: { [key: string]: number } = {};
  const getRowKey = (s: SearchResult) => {
    if (!s.groupKey) return `single-${s.id}`;
    return s.groupKey; // now groupKey is the exact parent id; only siblings share rows
  };
  for (const s of searchHistory) {
    const key = getRowKey(s);
    if (rowIndexByKey[key] === undefined) {
      rowIndexByKey[key] = rows.length;
      rows.push({ key, items: [s] });
    } else {
      rows[rowIndexByKey[key]].items.push(s);
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-start pt-6 px-2 gap-3">
      {rows.length === 0 ? (
        <button className="relative w-12 h-12 cursor-pointer transition-transform hover:scale-110 hover:brightness-110">
          <Image
            src="/hopscotch_boxes/hopscotch_1.png"
            alt="Hopscotch box 1"
            fill
            className="object-contain"
          />
        </button>
      ) : (
        rows.map((row, rowIdx) => (
          row.items.length === 1 ? (
            <button
              key={row.key}
              onClick={() => onSearchClick?.(row.items[0].id)}
              className="relative w-12 h-12 cursor-pointer transition-transform hover:scale-110 hover:brightness-110"
              title={row.items[0].query}
            >
              <Image
                src={getHopscotchImage(rows.slice(0, rowIdx).reduce((acc, r) => acc + r.items.length, 0))}
                alt={`Search: ${row.items[0].query}`}
                fill
                className="object-contain"
              />
            </button>
          ) : (
            <div key={row.key} className="flex flex-col gap-2">
              {(() => {
                const chunks: typeof row.items[] = [];
                for (let i = 0; i < row.items.length; i += 3) {
                  chunks.push(row.items.slice(i, i + 3));
                }
                const stepsBeforeRow = rows.slice(0, rowIdx).reduce((acc, r) => acc + r.items.length, 0);
                return chunks.map((chunk, ci) => (
                  <div key={`${row.key}-chunk-${ci}`} className="flex w-full justify-center gap-2">
                    {chunk.map((item, itemIdx) => (
                      <button
                        key={item.id}
                        onClick={() => onSearchClick?.(item.id)}
                        className="relative w-12 h-12 cursor-pointer transition-transform hover:scale-110 hover:brightness-110"
                        title={item.query}
                      >
                        <Image
                          src={getHopscotchImage(stepsBeforeRow + ci * 3 + itemIdx)}
                          alt={`Search: ${item.query}`}
                          fill
                          className="object-contain"
                        />
                      </button>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )
        ))
      )}
    </div>
  );
}
