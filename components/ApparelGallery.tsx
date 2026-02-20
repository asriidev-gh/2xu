'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import ApparelImageModal from '@/components/ApparelImageModal';

const APPAREL_IMAGES = [
  '/images/apparel/apparel_001.jpg',
  '/images/apparel/apparel_002.jpg',
  '/images/apparel/apparel_003.jpg',
  '/images/apparel/apparel_004.jpg',
  '/images/apparel/apparel_005.jpg',
  '/images/apparel/apparel_006.jpg',
];

type ApparelGalleryProps = {
  isVisible?: boolean;
};

export default function ApparelGallery({ isVisible = true }: ApparelGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const openModal = useCallback((src: string) => setModalImage(src), []);
  const closeModal = useCallback(() => setModalImage(null), []);

  return (
    <>
      <div
        className={`mt-14 mb-2 ${isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
        style={{ animationDelay: '1s' }}
      >
        {/* Contained block so apparel stands out inside the race section */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-[0_0_60px_20px_rgba(249,115,22,0.06),0_0_100px_40px_rgba(249,115,22,0.03)]"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
          }}
        >
          {/* Faded edge glow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-80"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(249,115,22,0.06) 0%, rgba(234,179,8,0.03) 40%, transparent 70%)',
            }}
          />
          <div className="relative px-6 py-6 sm:px-8 sm:py-8">
            {/* Heading: match race section style */}
            <div className="text-center mb-6">
              <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full mb-3 shadow-md">
                <span className="text-white font-semibold text-xs font-fira-sans uppercase tracking-wide">
                  Race Kit Preview
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-druk drop-shadow-md">
                2XU Apparel
              </h3>
              <div className="w-16 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full" />
            </div>
            {/* Marquee strip */}
            <div
              className="relative w-full overflow-hidden -mx-2"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`flex w-max gap-6 animate-marquee-rtl ${hoveredIndex !== null ? 'pause' : ''}`}
                style={{ width: 'max-content' }}
              >
                {[...APPAREL_IMAGES, ...APPAREL_IMAGES].map((src, i) => {
                  const logicalIndex = i % APPAREL_IMAGES.length;
                  const isHovered = hoveredIndex === logicalIndex;
                  return (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      className="flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/15 bg-white/10 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 hover:border-orange-400/50"
                      style={{ width: 160, height: 200 }}
                      onMouseEnter={() => setHoveredIndex(logicalIndex)}
                      onClick={() => openModal(src)}
                      aria-label={`View apparel image ${logicalIndex + 1}`}
                    >
                      <span
                        className={`block w-full h-full transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
                      >
                        <Image
                          src={src}
                          alt={`2XU apparel ${logicalIndex + 1}`}
                          width={160}
                          height={200}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Fade edges to container */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10 rounded-r-lg" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/40 via-black/20 to-transparent z-10 rounded-l-lg" />
            </div>
          </div>
        </div>
      </div>

      <ApparelImageModal
        isOpen={modalImage !== null}
        imageSrc={modalImage ?? ''}
        onClose={closeModal}
      />
    </>
  );
}
