'use client';

import { useEffect, useRef, useState } from 'react';
import {
  fetchImageWithProgress,
  loadImageViaElement,
  type ImageLoadStatus,
} from '@/lib/loadImageWithProgress';

export type { ImageLoadStatus };

export function useImageWithProgress(imageSrc: string | null | undefined, enabled: boolean) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [loadPercent, setLoadPercent] = useState(0);
  const [status, setStatus] = useState<ImageLoadStatus>('idle');
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled || !imageSrc) {
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
  }, [enabled, imageSrc]);

  return { displaySrc, loadPercent, status };
}
