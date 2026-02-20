'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ApparelImageModalProps = {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
};

export default function ApparelImageModal({ isOpen, imageSrc, onClose }: ApparelImageModalProps) {
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
      aria-label="View apparel image"
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
        className="relative max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageSrc}
          alt="2XU apparel"
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl ring-2 ring-white/10"
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
