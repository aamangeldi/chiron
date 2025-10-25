'use client';

import Image from 'next/image';

export default function Hopscotch() {
  const handleBoxClick = (boxNumber: number) => {
    console.log(`Clicked box ${boxNumber}`);
  };

  return (
    <div className="h-full flex flex-col items-center justify-start pt-8 px-2">
      {/* Box 1 */}
      <button
        onClick={() => handleBoxClick(1)}
        className="relative w-16 h-16 cursor-pointer transition-transform hover:scale-110 hover:brightness-110"
      >
        <Image
          src="/hopscotch_boxes/hopscotch_1.png"
          alt="Hopscotch box 1"
          fill
          className="object-contain"
        />
      </button>
    </div>
  );
}
