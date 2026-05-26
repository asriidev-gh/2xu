'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ApparelImageModalProps = {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  imageAlt?: string;
};

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

async function fetchImageWithProgress(
  src: string,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(src, { signal, cache: 'force-cache' });
  if (!res.ok) {
    throw new Error('Failed to load image');
  }

  const contentLength = res.headers.get('Content-Length');
  const total = contentLength ? Number.parseInt(contentLength, 10) : 0;

  if (!res.body || !Number.isFinite(total) || total <= 0) {
    onProgress(40);
    const blob = await res.blob();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    onProgress(100);
    return URL.createObjectURL(blob);
  }

  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress(Math.min(99, Math.round((loaded / total) * 100)));
    }
  }

  const blob = new Blob(chunks, { type: res.headers.get('Content-Type') || 'image/jpeg' });
  onProgress(100);
  return URL.createObjectURL(blob);
}

function loadImageViaElement(
  src: string,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let simulated = 0;
    const intervalId = setInterval(() => {
      if (simulated < 90) {
        simulated += 5;
        onProgress(simulated);
      }
    }, 120);

    const finish = (fn: () => void) => {
      clearInterval(intervalId);
      signal.removeEventListener('abort', onAbort);
      fn();
    };

    const onAbort = () => {
      finish(() => reject(new DOMException('Aborted', 'AbortError')));
    };

    signal.addEventListener('abort', onAbort);

    img.onload = () => {
      if (signal.aborted) {
        onAbort();
        return;
      }
      finish(() => {
        onProgress(100);
        resolve();
      });
    };

    img.onerror = () => {
      finish(() => reject(new Error('Failed to load image')));
    };

    img.src = src;
  });
}

export default function ApparelImageModal({
  isOpen,
  imageSrc,
  onClose,
  imageAlt = '2XU apparel',
}: ApparelImageModalProps) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [loadPercent, setLoadPercent] = useState(0);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setStatus('idle');
      setLoadPercent(0);
      setDisplaySrc(null);
      revokeObjectUrl();
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      setStatus('loading');
      setLoadPercent(0);
      setDisplaySrc(null);
      revokeObjectUrl();

      try {
        const objectUrl = await fetchImageWithProgress(imageSrc, setLoadPercent, signal);
        if (signal.aborted) return;
        objectUrlRef.current = objectUrl;
        setDisplaySrc(objectUrl);
        setStatus('ready');
      } catch (err) {
        if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
          return;
        }
        try {
          await loadImageViaElement(imageSrc, setLoadPercent, signal);
          if (signal.aborted) return;
          setDisplaySrc(imageSrc);
          setStatus('ready');
        } catch {
          if (signal.aborted) return;
          setStatus('error');
        }
      }
    };

    void run();

    return () => {
      controller.abort();
      revokeObjectUrl();
    };
  }, [isOpen, imageSrc]);

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
        {status === 'loading' && (
          <div
            className="flex flex-col items-center justify-center gap-4 px-8 py-10"
            role="status"
            aria-live="polite"
            aria-label={`Loading image, ${loadPercent} percent`}
          >
            <div className="relative h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${loadPercent} 100`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white font-fira-sans tabular-nums">
                {loadPercent}%
              </span>
            </div>
            <p className="text-sm text-gray-300 font-sweet-sans">Loading image…</p>
          </div>
        )}

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
