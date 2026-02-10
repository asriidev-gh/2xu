'use client';

import { useEffect, useRef, useState } from 'react';

type RaceCategory = {
  name: string;
  ageGroup: string;
  pricePhp: string;
  priceUsd: string;
  kitValueLabel?: string;
  kitDescription: string;
  highlight?: 'popular' | 'best-value' | 'youth' | 'community';
};

const raceCategories: RaceCategory[] = [
  {
    name: 'Youth Category',
    ageGroup: 'Ages 12 – 25',
    pricePhp: '₱1,800',
    priceUsd: '$32',
    kitValueLabel: 'Includes $60 worth of 2XU race kit',
    kitDescription: 'Perfect for emerging runners and student athletes stepping into the 2XU experience.',
    highlight: 'youth',
  },
  {
    name: 'Individual',
    ageGroup: 'Ages 26 and above',
    pricePhp: '₱1,990',
    priceUsd: '$40',
    kitValueLabel: 'Includes $70 worth of 2XU race kit',
    kitDescription: 'For dedicated runners who want a complete 2XU race experience and premium kit value.',
    highlight: 'popular',
  },
  {
    name: 'Team Category',
    ageGroup: 'Group of 4 runners',
    pricePhp: '₱6,900',
    priceUsd: '$120',
    kitValueLabel: 'Includes $200 worth of 2XU race kit',
    kitDescription: 'Built for crews, clubs, and friends who want to race, train, and celebrate together.',
    highlight: 'best-value',
  },
  {
    name: 'Athletes Category',
    ageGroup: 'Ages 12 and above',
    pricePhp: '₱1,800',
    priceUsd: '$32',
    kitDescription: 'For competitive and aspiring athletes ready to push performance with 2XU.',
    highlight: 'community',
  },
  {
    name: 'Advocate / Influencer',
    ageGroup: 'Ages 12 and above',
    pricePhp: '₱1,800',
    priceUsd: '$32',
    kitDescription: 'For community leaders, advocates, and creators who amplify the 2XU story.',
    highlight: 'community',
  },
  {
    name: 'Patron',
    ageGroup: 'Ages 12 and above',
    pricePhp: '₱2,500',
    priceUsd: '$43',
    kitDescription: 'For key supporters and partners who go the extra mile for the program.',
    highlight: 'community',
  },
];

// Shared with registration form for select options and payment amount
export const RACE_CATEGORY_NAMES: string[] = raceCategories.map((c) => c.name);
export const RACE_CATEGORY_PRICES: Record<string, { pricePhp: string; priceUsd: string }> = Object.fromEntries(
  raceCategories.map((c) => [c.name, { pricePhp: c.pricePhp, priceUsd: c.priceUsd }])
);

function getHighlightLabel(highlight?: RaceCategory['highlight']) {
  switch (highlight) {
    case 'popular':
      return 'Most Popular';
    case 'best-value':
      return 'Best Value';
    case 'youth':
      return 'For Youth';
    case 'community':
      return 'Community';
    default:
      return null;
  }
}

type RaceCategoriesSectionProps = {
  onSelectCategory?: (categoryName: string) => void;
};

export default function RaceCategoriesSection({ onSelectCategory }: RaceCategoriesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const scrollToRegistration = () => {
    const registrationSection = document.getElementById('registration');
    if (registrationSection) {
      const headerOffset = 80; // match fixed header height
      const elementPosition = registrationSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Trigger subtle fade/slide animations when section enters/leaves viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: '-50px 0px -50px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="race-categories"
      className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-gray-900 via-black to-gray-900"
    >
      {/* Subtle background accents to match hero/mission styling */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-orange-600/60 to-yellow-400/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-yellow-500/40 to-orange-500/60 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_55%)]" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div
          className={`text-center mb-12 ${
            isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
          }`}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full mb-4 shadow-lg">
            <span className="text-white font-semibold text-sm font-fira-sans uppercase tracking-wide">
              Race Experience &amp; Pricing
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-druk drop-shadow-lg">
            Choose Your Race Experience
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full shadow-md mb-4" />
          <p className="text-gray-200 max-w-2xl mx-auto font-sweet-sans text-lg">
            From youth runners to patrons and teams, each category comes with exclusive 2XU race entitlements to
            power your performance on and off the course.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {raceCategories.map((category, index) => {
            const highlightLabel = getHighlightLabel(category.highlight);

            return (
              <div
                key={category.name}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelectCategory?.(category.name);
                  scrollToRegistration();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory?.(category.name);
                    scrollToRegistration();
                  }
                }}
                className={`group relative h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 lg:p-7 shadow-2xl transition-all duration-300 hover:border-orange-400/80 hover:bg-white/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
                }`}
                style={{ animationDelay: `${0.3 + index * 0.07}s` }}
              >
                {/* Glow accent */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-orange-500/15 via-transparent to-yellow-400/10" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white font-druk">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm font-sweet-sans text-gray-300">
                        {category.ageGroup}
                      </p>
                    </div>
                    {highlightLabel && (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-fira-sans uppercase tracking-wide ${
                          category.highlight === 'best-value'
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-orange-500 text-white'
                        } shadow-md`}
                      >
                        {highlightLabel}
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl lg:text-4xl font-bold text-yellow-400 font-druk">
                        {category.pricePhp}
                      </span>
                      <span className="text-sm text-gray-300 font-sweet-sans uppercase tracking-wide">
                        PHP
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-300 font-sweet-sans">
                      Approx.{' '}
                      <span className="font-semibold text-white">
                        {category.priceUsd}
                      </span>{' '}
                      (USD)
                    </p>
                  </div>

                  {/* Entitlements */}
                  <div className="mt-2 space-y-2">
                    {category.kitValueLabel && (
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-yellow-400" />
                        <p className="text-sm text-gray-100 font-sweet-sans">
                          {category.kitValueLabel}
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
                      <p className="text-sm text-gray-200 font-sweet-sans">
                        {category.kitDescription}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-gray-300" />
                      <p className="text-xs text-gray-300 font-sweet-sans">
                        Includes official 2XU jersey race kit. Final designs and contents may vary.
                      </p>
                    </div>
                  </div>

                  {/* Subtle footer accent */}
                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 font-sweet-sans">
                    <span>Slots are limited per category.</span>
                    <span className="hidden sm:inline-block text-[11px] uppercase tracking-wide">
                      Secure your spot early
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <p
          className={`mt-8 text-center text-xs sm:text-sm text-gray-300/80 font-sweet-sans max-w-3xl mx-auto ${
            isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
          }`}
          style={{ animationDelay: '0.9s' }}
        >
          All pricing is indicative and may be subject to final confirmation. Race kits and entitlements are curated
          to deliver a premium 2XU experience aligned with the event&apos;s mission and partners.
        </p>
      </div>
    </section>
  );
}

