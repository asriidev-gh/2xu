'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import ApparelImageModal from './ApparelImageModal';
import ImageLoadProgress from '@/components/ImageLoadProgress';
import { useImageWithProgress } from '@/lib/useImageWithProgress';

const AYALA_RESULTS_IMAGE = '/images/results/speed_series_ayala_makati_results.jpg';
const BAGUIO_PROMO_UPDATES_IMAGE = '/images/updates/promo_updates.jpg';
const BAGUIO_PROMO_BANNER_IMAGE = '/images/updates/2xu_promo_banner.jpg';
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
const AUTO_PREVIEW_COUNTDOWN_START = 3;
const COUNTDOWN_STEP_MS = 1000;

function PromoPreviewTimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 9v4l2.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M10 3h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SeriesLegBadge({ legId }: { legId: number }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/80 font-sweet-sans">
      Series Leg {legId.toString().padStart(2, '0')}
    </span>
  );
}

function BaguioPromoUpdatePreview({
  isSlideActive,
  suppressPromoPreview = false,
}: BaguioPromoUpdatePreviewProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const promoImgRef = useRef<HTMLImageElement>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const countdownStartedRef = useRef(false);
  const overlayOpenedAtRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [autoPreview, setAutoPreview] = useState(false);
  const [thumbnailInView, setThumbnailInView] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [bannerWidth, setBannerWidth] = useState<number | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [thumbnailHovered, setThumbnailHovered] = useState(false);

  const syncBannerWidth = useCallback(() => {
    const width = promoImgRef.current?.getBoundingClientRect().width;
    if (width > 0) {
      setBannerWidth(Math.round(width));
    }
  }, []);

  const isOverlayOpen =
    !suppressPromoPreview &&
    (isMobile ? isSlideActive && thumbnailInView : autoPreview);

  const shouldPreloadOverlayImage = isSlideActive && !suppressPromoPreview;
  const {
    displaySrc: overlayDisplaySrc,
    loadPercent: overlayLoadPercent,
    status: overlayImageStatus,
  } = useImageWithProgress(BAGUIO_PROMO_UPDATES_IMAGE, shouldPreloadOverlayImage);

  const {
    displaySrc: bannerDisplaySrc,
    status: bannerImageStatus,
  } = useImageWithProgress(BAGUIO_PROMO_BANNER_IMAGE, shouldPreloadOverlayImage);

  const overlayImageReady = overlayImageStatus === 'ready' && Boolean(overlayDisplaySrc);
  const bannerImageReady = bannerImageStatus === 'ready' && Boolean(bannerDisplaySrc);
  const overlayImageLoading = isOverlayOpen && overlayImageStatus === 'loading';

  const showCountdown =
    autoPreview && overlayImageReady && countdown !== null && countdown >= 1;

  const clearCountdownInterval = () => {
    if (countdownIntervalRef.current != null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const dismissAllPreviews = useCallback(() => {
    clearCountdownInterval();
    countdownStartedRef.current = false;
    setAutoPreview(false);
    setCountdown(null);
  }, []);

  const startDesktopAutoPreview = useCallback(() => {
    if (suppressPromoPreview || isMobile || !isSlideActive || !thumbnailInView) return;
    setAutoPreview(true);
  }, [suppressPromoPreview, isMobile, isSlideActive, thumbnailInView]);

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
    if (suppressPromoPreview || !isSlideActive || isMobile) return;

    if (!thumbnailInView) {
      setAutoPreview(false);
      clearCountdownInterval();
      countdownStartedRef.current = false;
      setCountdown(null);
      return;
    }

    startDesktopAutoPreview();
  }, [suppressPromoPreview, thumbnailInView, isSlideActive, isMobile, startDesktopAutoPreview]);

  useEffect(() => {
    if (!autoPreview || !overlayImageReady) {
      if (!autoPreview) {
        clearCountdownInterval();
        countdownStartedRef.current = false;
        setCountdown(null);
      }
      return;
    }

    clearCountdownInterval();
    countdownStartedRef.current = true;
    overlayOpenedAtRef.current = Date.now();
    setCountdown(AUTO_PREVIEW_COUNTDOWN_START);

    const endTime = Date.now() + AUTO_PREVIEW_COUNTDOWN_START * COUNTDOWN_STEP_MS;

    const tickCountdown = () => {
      const remainingMs = endTime - Date.now();

      if (remainingMs <= 0) {
        clearCountdownInterval();
        countdownStartedRef.current = false;
        dismissAllPreviews();
        return;
      }

      const secondsLeft = Math.ceil(remainingMs / COUNTDOWN_STEP_MS);
      setCountdown(Math.max(1, Math.min(AUTO_PREVIEW_COUNTDOWN_START, secondsLeft)));
    };

    tickCountdown();
    countdownIntervalRef.current = window.setInterval(tickCountdown, 100);

    return () => {
      clearCountdownInterval();
      countdownStartedRef.current = false;
    };
  }, [autoPreview, overlayImageReady, dismissAllPreviews]);

  useEffect(() => {
    if (!isOverlayOpen) return;

    const el = anchorRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const openedRecently = Date.now() - overlayOpenedAtRef.current < 600;
        if (openedRecently || overlayImageStatus === 'loading') return;
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
  }, [isOverlayOpen, dismissAllPreviews, overlayImageStatus]);

  useEffect(
    () => () => {
      clearCountdownInterval();
    },
    []
  );

  useEffect(() => {
    if (!isOverlayOpen || !overlayImageReady) {
      setBannerWidth(null);
      return;
    }

    syncBannerWidth();

    const el = promoImgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(syncBannerWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOverlayOpen, overlayImageReady, overlayDisplaySrc, syncBannerWidth]);

  const promoOverlay =
    isOverlayOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`fixed inset-0 z-[9998] ${isMobile ? 'pointer-events-none' : 'pointer-events-auto'}`}
            role="presentation"
          >
            <div
              className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
                isOverlayOpen ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden
            />

            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <div
                className={`relative pointer-events-auto transition-all duration-500 ease-out ${
                  isOverlayOpen ? 'scale-100 opacity-100' : 'scale-[0.88] opacity-0'
                }`}
              >
                {showCountdown && (
                  <div
                    className="absolute -top-3 -left-3 z-10 flex items-center gap-1.5 rounded-full bg-gray-950/95 px-3 py-1.5 text-white shadow-lg ring-2 ring-orange-400/70"
                    aria-live="polite"
                    aria-label={`Closing in ${countdown} seconds`}
                  >
                    <PromoPreviewTimerIcon className="h-4 w-4 shrink-0 text-orange-400" />
                    <span className="min-w-[1ch] font-druk text-lg leading-none tabular-nums">{countdown}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={dismissAllPreviews}
                  className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-950/95 text-white shadow-lg ring-2 ring-orange-400/70 transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                  aria-label="Close promotion preview"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={openPromoShopLink}
                  disabled={!overlayImageReady}
                  className="group inline-flex w-fit max-w-[min(440px,calc(100vw-2rem))] flex-col items-stretch overflow-hidden rounded-xl bg-gray-900 shadow-2xl ring-2 ring-orange-400/50 transition hover:ring-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 disabled:cursor-wait"
                  aria-label="Shop 2XU recovery gear — opens in a new tab"
                  aria-busy={overlayImageLoading}
                >
                  {overlayImageLoading && (
                    <div className="flex min-h-[min(280px,50vh)] min-w-[min(280px,calc(100vw-2rem))] items-center justify-center">
                      <ImageLoadProgress percent={overlayLoadPercent} size="lg" label="Loading promotion…" />
                    </div>
                  )}

                  {overlayImageStatus === 'error' && (
                    <p className="px-6 py-8 text-center text-sm text-red-300 font-sweet-sans">
                      Could not load promotion image.
                    </p>
                  )}

                  {overlayImageReady && overlayDisplaySrc && (
                    <div className="inline-flex flex-col items-start">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={promoImgRef}
                        src={overlayDisplaySrc}
                        alt="Speed Series Baguio leg promotional update"
                        onLoad={syncBannerWidth}
                        className="block h-auto w-auto max-w-[min(440px,calc(100vw-2rem))] cursor-pointer transition group-hover:brightness-105 group-disabled:cursor-wait"
                        draggable={false}
                      />
                      {bannerImageReady && bannerDisplaySrc && bannerWidth != null && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={bannerDisplaySrc}
                          alt="2XU Philippines — ph.2xu.com"
                          style={{ width: bannerWidth }}
                          className="block h-auto max-w-none cursor-pointer border-t border-white/10 bg-black transition group-hover:brightness-105 group-disabled:cursor-wait"
                          draggable={false}
                        />
                      )}
                    </div>
                  )}
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
        className="group relative mx-auto sm:mx-0 h-[250px] w-full max-w-[500px] overflow-hidden rounded-lg bg-white shadow-lg"
        onMouseEnter={() => setThumbnailHovered(true)}
        onMouseLeave={() => setThumbnailHovered(false)}
      >
        <Image
          src={BAGUIO_PROMO_UPDATES_IMAGE}
          alt="Speed Series Baguio leg promotional update"
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 500px"
        />
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center transition-colors duration-200 ${
            thumbnailHovered ? 'bg-black/40' : 'bg-transparent'
          }`}
        >
          <button
            type="button"
            onClick={() => setImageModalOpen(true)}
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg ring-1 ring-black/10 transition-all duration-200 hover:bg-white hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 ${
              thumbnailHovered
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0 max-sm:pointer-events-auto max-sm:opacity-100'
            }`}
            aria-label="View full promotion image"
          >
            <FullscreenIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      <ApparelImageModal
        isOpen={imageModalOpen}
        imageSrc={BAGUIO_PROMO_UPDATES_IMAGE}
        imageAlt="Speed Series Baguio leg promotional update"
        bannerSrc={BAGUIO_PROMO_BANNER_IMAGE}
        bannerAlt="2XU Philippines — ph.2xu.com"
        linkHref={PROMO_UPDATES_2XU_URL}
        linkAriaLabel="Shop 2XU recovery gear — opens in a new tab"
        onLinkClick={() => setImageModalOpen(false)}
        onClose={() => setImageModalOpen(false)}
      />
      {promoOverlay}
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
          <div className="flex items-center justify-between gap-3 bg-black/40 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.3em] text-gray-300 font-fira-sans">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-orange-600 px-2 text-[10px] font-bold text-white">
                Updates
              </span>
              <span className="truncate text-gray-400">Speed Series Legs • City • Mountain • Sea</span>
            </div>
            <SeriesLegBadge legId={UPDATES[activeIndex].id} />
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
                const hasSlideMedia = item.id === 1 || item.id === 2 || item.id === 3;

                return (
                <div
                  key={item.id}
                  className="flex h-[380px] sm:h-[280px] items-center overflow-hidden px-4 sm:px-6 lg:px-8"
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
                    <div className="min-w-0 w-full sm:flex-1 sm:flex sm:justify-end">
                      {item.id === 1 ? (
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
                            className="block h-[250px] w-full max-w-full"
                          />
                        </div>
                      ) : item.id === 2 ? (
                        <BaguioPromoUpdatePreview
                          isSlideActive={activeIndex === BAGUIO_SLIDE_INDEX}
                          suppressPromoPreview={suppressPromoPreview}
                        />
                      ) : (
                        <div className="mx-auto sm:mx-0 flex h-[250px] w-full max-w-[500px] items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-6 text-center shadow-lg">
                          <p className="text-sm sm:text-base text-gray-300 font-sweet-sans leading-relaxed">
                            Updates for this leg is coming soon..
                          </p>
                        </div>
                      )}
                    </div>
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

