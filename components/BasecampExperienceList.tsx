import {
  getFcAdvocatePricing,
  getVipSpeedRateLabel,
  FC_PROMO_DAY_SINGLET_LABEL,
  BASECAMP_EXPERIENCE_ITEMS,
  BASECAMP_EXPERIENCE_TITLE,
  FC_STANDARD_RATE_PHP,
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
  const fcPricing = getFcAdvocatePricing();
  const isPromoDay = fcPricing.isPromoDay;

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
          {getVipSpeedRateLabel()}
        </p>
      )}
      {isPromoDay ? (
        <>
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
                ? 'mt-2 text-sm sm:text-base font-druk font-bold uppercase tracking-wide text-white text-center'
                : 'mt-2 text-sm font-druk font-bold uppercase tracking-wide text-gray-900'
            }
          >
            {FC_PROMO_DAY_SINGLET_LABEL}
          </p>
          {isHero && (
            <p className="mt-3 text-[11px] sm:text-xs text-gray-300 font-sweet-sans text-center leading-relaxed">
              Today-only Founders Club promo. Standard ₱{FC_STANDARD_RATE_PHP.toLocaleString('en-PH')} VIP rate with
              full Basecamp Experience resumes tomorrow.
            </p>
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
