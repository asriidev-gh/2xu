'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import ApparelImageModal from './ApparelImageModal';

const AYALA_RESULTS_IMAGE = '/images/results/speed_series_ayala_makati_results.jpg';
const BAGUIO_PROMO_UPDATES_IMAGE = '/images/updates/promo_updates.jpg';
const PROMO_UPDATES_2XU_URL =
  'https://ph.2xu.com/?utm_source=facebook&utm_campaign=oneofakindasia&utm_medium=affiliate&fbclid=IwY2xjawSZ80JleHRuA2FlbQIxMABicmlkETE1Wng2TVYzTFViWURuUkZrc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHjJ8vH_C40yRNp93UkbWKJKIu1vQshYZXzIsGjuAdYgRMaei8iYFmsj2kWdW_aem_ZSdXKtcLpLbl1isP-12QZQ';
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

type BaguioPromoUpdatePreviewProps = {
  isSlideActive: boolean;
  suppressPromoPreview?: boolean;
};

const BAGUIO_SLIDE_INDEX = UPDATES.findIndex((item) => item.id === 2);
const DESKTOP_AUTO_PREVIEW_MS = 3000;
const AUTO_PREVIEW_COUNTDOWN_START = 3;

function PromoPreviewTimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 9v4l2.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M10 3h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function BaguioPromoUpdatePreview({
  isSlideActive,
  suppressPromoPreview = false,
}: BaguioPromoUpdatePreviewProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const autoPreviewTimeoutRef = useRef<number | null>(null);
  const overlayOpenedAtRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [autoPreview, setAutoPreview] = useState(false);
  const [thumbnailInView, setThumbnailInView] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const isOverlayOpen =
    !suppressPromoPreview &&
    (isMobile ? isSlideActive && thumbnailInView : hoverPreview || autoPreview);

  const showCountdown = autoPreview && countdown !== null;

  const cancelHide = () => {
    if (hideTimeoutRef.current != null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const dismissAllPreviews = useCallback(() => {
    cancelHide();
    setHoverPreview(false);
    setAutoPreview(false);
    setCountdown(null);
    if (autoPreviewTimeoutRef.current != null) {
      window.clearTimeout(autoPreviewTimeoutRef.current);
      autoPreviewTimeoutRef.current = null;
    }
  }, []);

  const startDesktopAutoPreview = useCallback(() => {
    if (suppressPromoPreview || isMobile || !isSlideActive || !thumbnailInView) return;

    setAutoPreview(true);
    overlayOpenedAtRef.current = Date.now();
    if (autoPreviewTimeoutRef.current != null) {
      window.clearTimeout(autoPreviewTimeoutRef.current);
    }
    autoPreviewTimeoutRef.current = window.setTimeout(() => {
      setAutoPreview(false);
      autoPreviewTimeoutRef.current = null;
    }, DESKTOP_AUTO_PREVIEW_MS);
  }, [suppressPromoPreview, isMobile, isSlideActive, thumbnailInView]);

  const showPreview = () => {
    if (suppressPromoPreview) return;
    cancelHide();
    setHoverPreview(true);
  };

  const scheduleHide = () => {
    cancelHide();
    hideTimeoutRef.current = window.setTimeout(() => {
      setOverlayReady(false);
      setHoverPreview(false);
    }, 120);
  };

  const openPromoShopLink = useCallback(() => {
    window.open(PROMO_UPDATES_2XU_URL, '_blank', 'noopener,noreferrer');
    dismissAllPreviews();
  }, [dismissAllPreviews]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateMobile = () => setIsMobile(mediaQuery.matches);
    updateMobile();
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

  useEffect(() => {
    if (!isSlideActive) {
      dismissAllPreviews();
    }
  }, [isSlideActive, dismissAllPreviews]);

  useEffect(() => {
    if (suppressPromoPreview) {
      dismissAllPreviews();
    }
  }, [suppressPromoPreview, dismissAllPreviews]);

  useEffect(() => {
    if (!isSlideActive || suppressPromoPreview) {
      setThumbnailInView(false);
      return;
    }

    const el = anchorRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setThumbnailInView(entry.isIntersecting && entry.intersectionRatio >= 0.35);
      },
      {
        threshold: [0, 0.2, 0.35, 0.5],
        rootMargin: '-5% 0px -5% 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isSlideActive, suppressPromoPreview]);

  useEffect(() => {
    if (suppressPromoPreview || !thumbnailInView || !isSlideActive) {
      if (!hoverPreview) {
        setAutoPreview(false);
        if (autoPreviewTimeoutRef.current != null) {
          window.clearTimeout(autoPreviewTimeoutRef.current);
          autoPreviewTimeoutRef.current = null;
        }
      }
      return;
    }

    if (isMobile) return;

    startDesktopAutoPreview();

    return () => {
      if (autoPreviewTimeoutRef.current != null) {
        window.clearTimeout(autoPreviewTimeoutRef.current);
        autoPreviewTimeoutRef.current = null;
      }
    };
  }, [
    suppressPromoPreview,
    thumbnailInView,
    isSlideActive,
    isMobile,
    hoverPreview,
    startDesktopAutoPreview,
  ]);

  useEffect(() => {
    if (!isOverlayOpen) return;

    const el = anchorRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const openedRecently = Date.now() - overlayOpenedAtRef.current < 600;
        if (openedRecently) return;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.15) {
          dismissAllPreviews();
        }
      },
      {
        threshold: [0, 0.15, 0.35],
        rootMargin: '-8% 0px -8% 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isOverlayOpen, dismissAllPreviews]);

  useEffect(() => {
    if (!hoverPreview) return;
    overlayOpenedAtRef.current = Date.now();
  }, [hoverPreview]);

  useEffect(() => {
    if (!autoPreview) {
      setCountdown(null);
      return;
    }

    setCountdown(AUTO_PREVIEW_COUNTDOWN_START);
    const step2 = window.setTimeout(() => setCountdown(2), 1000);
    const step1 = window.setTimeout(() => setCountdown(1), 2000);

    return () => {
      window.clearTimeout(step2);
      window.clearTimeout(step1);
    };
  }, [autoPreview]);

  useEffect(() => {
    if (!isOverlayOpen) {
      setOverlayReady(false);
      return;
    }
    overlayOpenedAtRef.current = Date.now();
    const raf = requestAnimationFrame(() => setOverlayReady(true));
    return () => cancelAnimationFrame(raf);
  }, [isOverlayOpen]);

  useEffect(
    () => () => {
      cancelHide();
      if (autoPreviewTimeoutRef.current != null) {
        window.clearTimeout(autoPreviewTimeoutRef.current);
      }
    },
    []
  );

  const hoverOverlay =
    isOverlayOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`fixed inset-0 z-[9998] ${isMobile ? 'pointer-events-none' : 'pointer-events-auto'}`}
            onMouseLeave={isMobile ? undefined : scheduleHide}
            role="presentation"
          >
            <div
              className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
                overlayReady ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden
            />

            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <div
                className={`relative pointer-events-auto transition-all duration-500 ease-out ${
                  overlayReady ? 'scale-100 opacity-100' : 'scale-[0.88] opacity-0'
                }`}
                onMouseEnter={isMobile ? undefined : showPreview}
              >
                {showCountdown && (
                  <div
                    className="absolute -top-3 -right-3 z-10 flex items-center gap-1.5 rounded-full bg-gray-950/95 px-3 py-1.5 text-white shadow-lg ring-2 ring-orange-400/70"
                    aria-live="polite"
                    aria-label={`Closing in ${countdown} seconds`}
                  >
                    <PromoPreviewTimerIcon className="h-4 w-4 shrink-0 text-orange-400" />
                    <span className="min-w-[1ch] font-druk text-lg leading-none tabular-nums">{countdown}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openPromoShopLink}
                  className="group block overflow-hidden rounded-xl bg-white shadow-2xl ring-2 ring-orange-400/50 transition hover:ring-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                  aria-label="Shop 2XU recovery gear — opens in a new tab"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={BAGUIO_PROMO_UPDATES_IMAGE}
                    alt="Speed Series Baguio leg promotional update"
                    className="block h-auto w-auto max-h-[min(560px,78vh)] max-w-[min(440px,calc(100vw-2rem))] cursor-pointer transition group-hover:brightness-105"
                    draggable={false}
                  />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={anchorRef}
        className="relative mx-auto sm:mx-0 h-[250px] w-full max-w-[500px] overflow-hidden rounded-lg bg-white shadow-lg"
        onMouseEnter={isMobile ? undefined : showPreview}
        onMouseLeave={isMobile ? undefined : scheduleHide}
      >
        <Image
          src={BAGUIO_PROMO_UPDATES_IMAGE}
          alt="Speed Series Baguio leg promotional update"
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 500px"
        />
        <button
          type="button"
          onClick={openPromoShopLink}
          className="absolute inset-0 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset"
          aria-label="Shop 2XU recovery gear — opens in a new tab"
        />
      </div>
      {hoverOverlay}
    </>
  );
}

export default function UpdatesSection({
  suppressPromoPreview = false,
}: {
  suppressPromoPreview?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(BAGUIO_SLIDE_INDEX);
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
              {UPDATES.map((item) => {
                const hasSlideMedia = item.id === 1 || item.id === 2;

                return (
                <div
                  key={item.id}
                  className="flex h-[380px] sm:h-[280px] items-center px-4 sm:px-6 lg:px-8"
                >
                  <div
                    className={`flex w-full gap-4 ${
                      hasSlideMedia
                        ? 'flex-col sm:flex-row sm:items-center sm:justify-between'
                        : 'items-center justify-between'
                    }`}
                  >
                    <div className={hasSlideMedia ? 'min-w-0 shrink-0 sm:max-w-[45%]' : ''}>
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
                    ) : item.id === 2 ? (
                      <div className="min-w-0 w-full sm:flex-1 sm:flex sm:justify-end">
                        <BaguioPromoUpdatePreview
                          isSlideActive={activeIndex === BAGUIO_SLIDE_INDEX}
                          suppressPromoPreview={suppressPromoPreview}
                        />
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
              );
              })}
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
        imageAlt="Speed Series Ayala Makati race results"
        onClose={() => setResultsModalOpen(false)}
      />
    </section>
  );
}

