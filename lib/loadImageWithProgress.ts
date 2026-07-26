export type ImageLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export async function fetchImageWithProgress(
  src: string,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(src, { signal, cache: 'no-store' });
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
