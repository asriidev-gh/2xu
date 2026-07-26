export type ImageLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Preloads via an Image element and reports simulated progress until onload. */
export function loadImageViaElement(
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
