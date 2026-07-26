'use client';

import { useEffect, useState } from 'react';
import { loadImageViaElement, type ImageLoadStatus } from '@/lib/loadImageWithProgress';

export type { ImageLoadStatus };

/**
 * Loads an image with a progress indicator, then displays the original URL
 * (not a blob:) so DevTools / CDN cache-busting paths stay visible.
 */
export function useImageWithProgress(imageSrc: string | null | undefined, enabled: boolean) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [loadPercent, setLoadPercent] = useState(0);
  const [status, setStatus] = useState<ImageLoadStatus>('idle');

  useEffect(() => {
    if (!enabled || !imageSrc) {
      setStatus('idle');
      setLoadPercent(0);
      setDisplaySrc(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      setStatus('loading');
      setLoadPercent(0);
      setDisplaySrc(null);

      try {
        await loadImageViaElement(imageSrc, setLoadPercent, signal);
        if (signal.aborted) return;
        setDisplaySrc(imageSrc);
        setStatus('ready');
      } catch (err) {
        if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
          return;
        }
        setStatus('error');
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [enabled, imageSrc]);

  return { displaySrc, loadPercent, status };
}
