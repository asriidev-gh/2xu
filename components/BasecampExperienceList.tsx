import {
  BASECAMP_EXPERIENCE_ITEMS,
  BASECAMP_EXPERIENCE_TITLE,
  VIP_SPEED_RATE_LABEL,
} from '@/lib/basecampExperience';

type BasecampExperienceListProps = {
  variant?: 'hero' | 'registration';
  showVipRate?: boolean;
};

export function BasecampExperienceList({
  variant = 'hero',
  showVipRate = true,
}: BasecampExperienceListProps) {
  const isHero = variant === 'hero';

  return (
    <div className={isHero ? 'text-left' : ''}>
      {showVipRate && (
        <p
          className={
            isHero
              ? 'text-base sm:text-lg font-druk font-bold uppercase tracking-wide text-yellow-400 mb-1 text-center'
              : 'text-sm font-druk font-bold uppercase tracking-wide text-orange-700 mb-1'
          }
        >
          {VIP_SPEED_RATE_LABEL}
        </p>
      )}
      <p
        className={
          isHero
            ? 'text-xs uppercase tracking-[0.2em] text-orange-200 font-fira-sans'
            : 'text-xs uppercase tracking-[0.15em] text-gray-500 font-fira-sans'
        }
      >
        Includes:
      </p>
      <p
        className={
          isHero
            ? 'mt-1 text-xs sm:text-sm font-druk font-bold uppercase tracking-wide text-white'
            : 'mt-1 text-xs font-druk font-bold uppercase tracking-wide text-gray-800'
        }
      >
        {BASECAMP_EXPERIENCE_TITLE}
      </p>
      <ol
        className={
          isHero
            ? 'mt-2 space-y-1.5 text-left text-[11px] sm:text-xs text-gray-200 font-sweet-sans list-decimal list-outside ml-4 pl-1'
            : 'mt-2 space-y-1 text-left text-xs text-gray-700 font-sweet-sans list-decimal list-outside ml-4 pl-1'
        }
      >
        {BASECAMP_EXPERIENCE_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );
}
