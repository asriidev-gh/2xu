type ImageLoadProgressProps = {
  percent: number;
  label?: string;
  size?: 'md' | 'lg';
};

export default function ImageLoadProgress({
  percent,
  label = 'Loading image…',
  size = 'md',
}: ImageLoadProgressProps) {
  const ringClass = size === 'lg' ? 'h-24 w-24' : 'h-20 w-20';
  const textClass = size === 'lg' ? 'text-lg' : 'text-base';

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 px-8 py-10"
      role="status"
      aria-live="polite"
      aria-label={`Loading image, ${percent} percent`}
    >
      <div className={`relative ${ringClass}`}>
        <svg className={`${ringClass} -rotate-90`} viewBox="0 0 36 36" aria-hidden>
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
            strokeDasharray={`${percent} 100`}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold text-white font-fira-sans tabular-nums ${textClass}`}
        >
          {percent}%
        </span>
      </div>
      <p className="text-sm text-gray-300 font-sweet-sans">{label}</p>
    </div>
  );
}
