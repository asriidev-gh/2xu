'use client';

import { useEffect, useRef, useState } from 'react';
import ApparelImageModal from './ApparelImageModal';

const AYALA_RESULTS_IMAGE = '/images/results/speed_series_ayala_makati_results.jpg';
const AYALA_FACEBOOK_EMBED_SRC =
  'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fweb.facebook.com%2FPHathletesclub%2Fposts%2Fpfbid02aYNHHqNFzfyPW3QJUPDKo5G5q2wKgcSggaLaLS6GGkVcaSsjJBgv5SGNfSrLqR3Pl&show_text=true&width=500';

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
  const AYALA_LAUNCH_INDEX = 0;
  const [activeIndex, setActiveIndex] = useState(AYALA_LAUNCH_INDEX);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
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

  const goToPrevUpdate = () => {
    setActiveIndex((prev) => (prev - 1 + UPDATES.length) % UPDATES.length);
  };

  const goToNextUpdate = () => {
    setActiveIndex((prev) => (prev + 1) % UPDATES.length);
  };

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

        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
          {/* Faux ticker strip */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.3em] text-gray-300 font-fira-sans">
            <span className="inline-flex h-5 items-center rounded-full bg-orange-600 px-2 text-[10px] font-bold text-white">
              Updates
            </span>
            <span className="text-gray-400">Speed Series Legs • City • Mountain • Sea</span>
          </div>

          {/* Vertical ticker */}
          <div className="relative h-[380px] sm:h-[280px] overflow-hidden">
            <div
              className="absolute inset-0 transition-transform duration-600 ease-out"
              style={{
                transform: `translateY(-${activeIndex * 100}%)`,
              }}
            >
              {UPDATES.map((item) => (
                <div
                  key={item.id}
                  className="flex h-[380px] sm:h-[280px] items-center px-4 sm:px-6 lg:px-8"
                >
                  <div
                    className={`flex w-full gap-4 ${
                      item.id === 1
                        ? 'flex-col sm:flex-row sm:items-center sm:justify-between'
                        : 'items-center justify-between'
                    }`}
                  >
                    <div className={item.id === 1 ? 'min-w-0 shrink-0 sm:max-w-[45%]' : ''}>
                      <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-yellow-400 font-fira-sans mb-1">
                        {item.label}
                      </p>
                      <h3 className="text-lg sm:text-xl font-druk font-bold text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-300 font-sweet-sans">
                        <span>{item.meta}</span>
                        {item.id === 1 && (
                          <button
                            type="button"
                            onClick={() => setResultsModalOpen(true)}
                            className="rounded-full border border-yellow-400/60 bg-yellow-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-yellow-400 transition-colors hover:bg-yellow-400/20 hover:text-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                          >
                            See Results
                          </button>
                        )}
                      </p>
                    </div>
                    {item.id === 1 ? (
                      <div className="min-w-0 w-full sm:flex-1 sm:flex sm:justify-end">
                        <div className="mx-auto sm:mx-0 w-full max-w-[500px] overflow-hidden rounded-lg bg-white shadow-lg">
                          <iframe
                            src={AYALA_FACEBOOK_EMBED_SRC}
                            width="500"
                            height="250"
                            style={{ border: 'none', overflow: 'hidden' }}
                            scrolling="no"
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            title="Ayala Triangle Launch Facebook post"
                            className="w-full max-w-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="hidden sm:flex flex-col items-end text-right gap-1 text-[11px] text-gray-400 font-sweet-sans shrink-0">
                        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/80">
                          Series Leg {item.id.toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/40 px-4 py-3">
            <button
              type="button"
              onClick={goToPrevUpdate}
              className="rounded-full border border-white/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Go to previous update"
            >
              Prev
            </button>
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
            <button
              type="button"
              onClick={goToNextUpdate}
              className="rounded-full border border-white/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Go to next update"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ApparelImageModal
        isOpen={resultsModalOpen}
        imageSrc={AYALA_RESULTS_IMAGE}
        onClose={() => setResultsModalOpen(false)}
      />
    </section>
  );
}

