'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ImageLoadProgress from '@/components/ImageLoadProgress';
import { useImageWithProgress } from '@/lib/useImageWithProgress';

type ApparelImageModalProps = {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  imageAlt?: string;
};

export default function ApparelImageModal({
  isOpen,
  imageSrc,
  onClose,
  imageAlt = '2XU apparel',
}: ApparelImageModalProps) {
  const { displaySrc, loadPercent, status } = useImageWithProgress(imageSrc, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
        className="relative max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center p-4 min-h-[240px]"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'loading' && <ImageLoadProgress percent={loadPercent} size="lg" />}

        {status === 'error' && (
          <p className="text-sm text-red-400 font-sweet-sans px-4 text-center">
            Could not load image. Please try again.
          </p>
        )}

        {status === 'ready' && displaySrc && (
          <img
            src={displaySrc}
            alt={imageAlt}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl ring-2 ring-white/10"
          />
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
