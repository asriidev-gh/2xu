'use client';

import { useEffect, useRef, useState } from 'react';

type UpdateItem = {
  id: number;
  label: string;
  title: string;
  meta: string;
};

const UPDATES: UpdateItem[] = [
  {
    id: 1,
    label: 'Speed Series by City',
    title: 'Ayala Triangle Launch',
    meta: 'May 17, 2026 • Makati City',
  },
  {
    id: 2,
    label: 'Speed Series by the Mountain',
    title: 'Baguio Leg',
    meta: 'July 26, 2026 • Baguio City',
  },
  {
    id: 3,
    label: 'Speed Series by the Sea',
    title: 'Boracay Leg',
    meta: 'Date TBA • Boracay Island',
  },
];

export default function UpdatesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.1);
      },
      {
        threshold: [0, 0.1, 0.5],
        rootMargin: '-40px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % UPDATES.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section
      id="updates"
      ref={sectionRef}
      className="bg-gradient-to-b from-gray-950 via-gray-900 to-black py-10 sm:py-12 border-t border-gray-800"
    >
      <div
        className={`container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 transform transition-all duration-600 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-yellow-400 font-fira-sans mb-1">
              Watch out for our
            </p>
            <h2 className="text-2xl sm:text-3xl font-druk font-bold text-white leading-tight">
              Speed Series Updates
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 font-sweet-sans">
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/60 bg-orange-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live Series Legs
            </span>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Faux ticker strip */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.3em] text-gray-300 font-fira-sans">
            <span className="inline-flex h-5 items-center rounded-full bg-orange-600 px-2 text-[10px] font-bold text-white">
              Updates
            </span>
            <span className="text-gray-400">Speed Series Legs • City • Mountain • Sea</span>
          </div>

          {/* Vertical ticker */}
          <div className="relative h-32 sm:h-36 overflow-hidden">
            <div
              className="absolute inset-0 transition-transform duration-600 ease-out"
              style={{
                transform: `translateY(-${activeIndex * 100}%)`,
              }}
            >
              {UPDATES.map((item) => (
                <div
                  key={item.id}
                  className="flex h-32 sm:h-36 items-center px-4 sm:px-6 lg:px-8"
                >
                  <div className="flex w-full items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-yellow-400 font-fira-sans mb-1">
                        {item.label}
                      </p>
                      <h3 className="text-lg sm:text-xl font-druk font-bold text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-gray-300 font-sweet-sans">
                        {item.meta}
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end text-right gap-1 text-[11px] text-gray-400 font-sweet-sans">
                      <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/80">
                        Series Leg {item.id.toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/40 px-4 py-3">
            {UPDATES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === index
                    ? 'w-6 bg-yellow-400'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to update ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

