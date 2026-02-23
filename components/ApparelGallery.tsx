'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

const CLIP_EXTEND = 1.1; // pseudo-elements are 110% of container
const AUTO_SCROLL_SPEED = 1;
const DRAG_THRESHOLD = 5;

export default function ApparelGallery({ isVisible = true }: ApparelGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const borderRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const didDragRef = useRef(false);
  const autoScrollRef = useRef<number | null>(null);

  const openModal = useCallback((src: string) => setModalImage(src), []);
  const closeModal = useCallback(() => setModalImage(null), []);

  const handleThumbClick = useCallback((src: string) => {
    if (didDragRef.current) return;
    openModal(src);
  }, [openModal]);

  useEffect(() => {
    const el = borderRef.current;
    if (!el) return;
    const setClipVars = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const clipW = Math.round(w * CLIP_EXTEND);
      const clipH = Math.round(h * CLIP_EXTEND);
      el.style.setProperty('--clip-w', `${clipW}px`);
      el.style.setProperty('--clip-h', `${clipH}px`);
    };
    setClipVars();
    const ro = new ResizeObserver(setClipVars);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-scroll when not hovering and not dragging
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const tick = () => {
      if (hoveredIndex !== null || isDragging) return;
      el.scrollLeft += AUTO_SCROLL_SPEED;
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) el.scrollLeft -= half;
    };
    autoScrollRef.current = window.setInterval(tick, 20);
    return () => {
      if (autoScrollRef.current) window.clearInterval(autoScrollRef.current);
    };
  }, [hoveredIndex, isDragging]);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    dragStartScroll.current = scrollRef.current?.scrollLeft ?? 0;
    setIsDragging(true);
    didDragRef.current = false;
  }, []);

  const applyDrag = useCallback((clientX: number) => {
    if (!scrollRef.current) return;
    const delta = clientX - dragStartX.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) didDragRef.current = true;
    const el = scrollRef.current;
    const half = el.scrollWidth / 2;
    let next = dragStartScroll.current - delta;
    if (next >= half) {
      next -= half;
      dragStartScroll.current = next;
      dragStartX.current = clientX;
    } else if (next < 0) {
      next += half;
      dragStartScroll.current = next;
      dragStartX.current = clientX;
    }
    el.scrollLeft = Math.max(0, Math.min(next, el.scrollWidth - el.clientWidth));
  }, []);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    if ('touches' in e) e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    applyDrag(clientX);
  }, [isDragging, applyDrag]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => applyDrag(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      applyDrag(e.touches[0].clientX);
    };
    const onUp = () => handlePointerUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, [isDragging, applyDrag, handlePointerUp]);

  return (
    <>
      <div
        className={`mt-6 mb-12 ${isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
        style={{ animationDelay: '0.1s' }}
      >
        {/* Wrapper for animated drawing border (clip effect) */}
        <div
          ref={borderRef}
          className="apparel-clip-border rounded-2xl"
        >
          {/* Contained block so apparel stands out inside the race section */}
          <div
            className="relative z-10 rounded-2xl overflow-hidden shadow-[0_0_60px_20px_rgba(249,115,22,0.06),0_0_100px_40px_rgba(249,115,22,0.03)]"
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
            {/* Marquee strip: scrollable + drag + auto-scroll */}
            <div
              ref={scrollRef}
              className="relative w-full overflow-x-auto overflow-y-hidden -mx-2 scrollbar-hide select-none cursor-grab active:cursor-grabbing"
              onMouseLeave={() => setHoveredIndex(null)}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              <div className="flex w-max gap-6 py-1" style={{ width: 'max-content' }}>
                {[...APPAREL_IMAGES, ...APPAREL_IMAGES].map((src, i) => {
                  const logicalIndex = i % APPAREL_IMAGES.length;
                  const isHovered = hoveredIndex === logicalIndex;
                  return (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      className="flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/15 bg-white/10 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 hover:border-orange-400/50 pointer-events-auto"
                      style={{ width: 160, height: 200 }}
                      onMouseEnter={() => setHoveredIndex(logicalIndex)}
                      onClick={() => handleThumbClick(src)}
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
      </div>

      <ApparelImageModal
        isOpen={modalImage !== null}
        imageSrc={modalImage ?? ''}
        onClose={closeModal}
      />
    </>
  );
}
