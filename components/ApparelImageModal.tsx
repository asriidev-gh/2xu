'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ImageLoadProgress from '@/components/ImageLoadProgress';
import { useImageWithProgress } from '@/lib/useImageWithProgress';

type ApparelImageModalProps = {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  imageAlt?: string;
  bannerSrc?: string;
  bannerAlt?: string;
  /** Opens in a new tab when the image stack is clicked. */
  linkHref?: string;
  linkAriaLabel?: string;
  onLinkClick?: () => void;
};

export default function ApparelImageModal({
  isOpen,
  imageSrc,
  onClose,
  imageAlt = '2XU apparel',
  bannerSrc,
  bannerAlt = '',
  linkHref,
  linkAriaLabel,
  onLinkClick,
}: ApparelImageModalProps) {
  const promoImgRef = useRef<HTMLImageElement>(null);
  const [bannerWidth, setBannerWidth] = useState<number | null>(null);

  const { displaySrc, loadPercent, status } = useImageWithProgress(imageSrc, isOpen);
  const { displaySrc: bannerDisplaySrc, status: bannerStatus } = useImageWithProgress(
    bannerSrc,
    isOpen && Boolean(bannerSrc)
  );

  const syncBannerWidth = useCallback(() => {
    const width = promoImgRef.current?.getBoundingClientRect().width;
    if (width != null && width > 0) {
      setBannerWidth(Math.round(width));
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || status !== 'ready') {
      setBannerWidth(null);
      return;
    }

    syncBannerWidth();

    const el = promoImgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(syncBannerWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen, status, displaySrc, syncBannerWidth]);

  if (!isOpen) return null;

  const bannerReady = bannerStatus === 'ready' && Boolean(bannerDisplaySrc);
  const showBanner = Boolean(bannerSrc) && bannerReady && bannerWidth != null;

  const openLink = () => {
    if (!linkHref) return;
    window.open(linkHref, '_blank', 'noopener,noreferrer');
    onLinkClick?.();
  };

  const linkedImageClass =
    'cursor-pointer transition group-hover:brightness-105 group-focus-visible:brightness-105';

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-label="View image"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black font-fira-sans border border-white/20 shadow-lg"
        aria-label="Close"
      >
        <span>Close</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        className="relative max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center p-4 min-h-[240px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'loading' && <ImageLoadProgress percent={loadPercent} size="lg" />}

        {status === 'error' && (
          <p className="text-sm text-red-400 font-sweet-sans px-4 text-center">
            Could not load image. Please try again.
          </p>
        )}

        {status === 'ready' && displaySrc && !bannerSrc && (
          linkHref ? (
            <button
              type="button"
              onClick={openLink}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
              aria-label={linkAriaLabel}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displaySrc}
                alt={imageAlt}
                className={`max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl ring-2 ring-white/10 ${linkedImageClass}`}
                draggable={false}
              />
            </button>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- blob/object URLs from progressive loader */
            <img
              src={displaySrc}
              alt={imageAlt}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl ring-2 ring-white/10"
            />
          )
        )}

        {status === 'ready' && displaySrc && bannerSrc && (
          linkHref ? (
            <button
              type="button"
              onClick={openLink}
              className="group inline-flex max-w-full flex-col items-start overflow-hidden rounded-lg shadow-2xl ring-2 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label={linkAriaLabel}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={promoImgRef}
                src={displaySrc}
                alt={imageAlt}
                onLoad={syncBannerWidth}
                className={`block h-auto w-auto max-h-[min(75vh,800px)] max-w-[90vw] object-contain ${linkedImageClass}`}
                draggable={false}
              />
              {showBanner && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={bannerDisplaySrc!}
                  alt={bannerAlt}
                  style={{ width: bannerWidth }}
                  className={`block h-auto max-w-none border-t border-white/10 bg-black ${linkedImageClass}`}
                  draggable={false}
                />
              )}
            </button>
          ) : (
            <div className="inline-flex max-w-full flex-col items-start overflow-hidden rounded-lg shadow-2xl ring-2 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={promoImgRef}
                src={displaySrc}
                alt={imageAlt}
                onLoad={syncBannerWidth}
                className="block h-auto w-auto max-h-[min(75vh,800px)] max-w-[90vw] object-contain"
                draggable={false}
              />
              {showBanner && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={bannerDisplaySrc!}
                  alt={bannerAlt}
                  style={{ width: bannerWidth }}
                  className="block h-auto max-w-none border-t border-white/10 bg-black"
                  draggable={false}
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
