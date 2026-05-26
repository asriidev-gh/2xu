'use client';

import { useCallback, useEffect, useState } from 'react';
import ImageLoadProgress from '@/components/ImageLoadProgress';
import { useImageWithProgress } from '@/lib/useImageWithProgress';

const AUTO_DISMISS_MS = 30_000;
const IMAGE_SRC = '/images/baguio_leg.jpg';

type HomePromoSplashProps = {
  /** Called when the promo image is tapped (e.g. scroll to registration as Patron). */
  onPatronImageClick?: () => void;
};

export default function HomePromoSplash({ onPatronImageClick }: HomePromoSplashProps) {
  const [open, setOpen] = useState(false);
  const { displaySrc, loadPercent, status } = useImageWithProgress(IMAGE_SRC, open);

  useEffect(() => {
    setOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [open, dismiss]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="home-promo-title">
      <h2 id="home-promo-title" className="sr-only">
        Baguio leg promotion
      </h2>

      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/75"
        aria-label="Dismiss promotion"
        onClick={dismiss}
      />

      <div className="pointer-events-none relative z-10 flex h-full min-h-0 flex-col items-center justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <button
          type="button"
          onClick={dismiss}
          className="pointer-events-auto absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white text-gray-900 shadow-lg ring-1 ring-black/10 transition hover:bg-gray-100 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 sm:right-6 sm:top-[max(1rem,env(safe-area-inset-top))]"
          aria-label="Close promotion"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="pointer-events-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center min-h-[240px]">
          {status === 'loading' && <ImageLoadProgress percent={loadPercent} size="lg" />}

          {status === 'error' && (
            <p className="text-sm text-red-300 font-sweet-sans px-4 text-center">
              Could not load promotion. You can close and continue browsing.
            </p>
          )}

          {status === 'ready' && displaySrc && (
            <button
              type="button"
              onClick={() => {
                dismiss();
                onPatronImageClick?.();
              }}
              className="group relative max-w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              aria-label="Continue to Patron registration"
            >
              <img
                src={displaySrc}
                alt="Speed Series Baguio leg promotion"
                className="max-h-[min(72vh,72dvh)] w-auto max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-white/10 transition group-hover:brightness-105 group-active:scale-[0.99]"
              />
              <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm font-fira-sans sm:text-xs">
                Tap to register · Patron
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
