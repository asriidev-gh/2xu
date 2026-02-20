'use client';

type SpeedSeriesMechanicsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// navpanes=0 hides the sidebar/thumbnails; toolbar=0 hides the PDF viewer toolbar
const PDF_URL = '/SpeedSeriesMechanics.pdf#navpanes=0&toolbar=0';

/** Use for "open in new tab" on mobile so native viewer can scroll all pages and pinch-zoom */
export const SPEED_SERIES_PDF_URL = '/SpeedSeriesMechanics.pdf';

export default function SpeedSeriesMechanicsModal({ isOpen, onClose }: SpeedSeriesMechanicsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title" className="sr-only">Speed Series Mechanics</h2>
      {/* Floating close button - always visible on top of the PDF */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Close"
      >
        <span>Close</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <iframe
        src={PDF_URL}
        title="Speed Series Mechanics PDF"
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}
