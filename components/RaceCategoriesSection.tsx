'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ApparelGallery from '@/components/ApparelGallery';
import { SPEED_SERIES_PDF_URL } from '@/components/SpeedSeriesMechanicsModal';
import {
  raceCategories,
  RACE_CATEGORY_NAMES,
  RACE_CATEGORY_PRICES,
  PATRON_SPEED_DISTANCES,
  type RaceCategoryDefinition,
} from '@/lib/raceCategories';

export { RACE_CATEGORY_NAMES, RACE_CATEGORY_PRICES, PATRON_SPEED_DISTANCES };

function getHighlightLabel(highlight?: RaceCategoryDefinition['highlight']) {
  switch (highlight) {
    case 'popular':
      return 'Most Popular';
    case 'best-value':
      return 'Best Value';
    case 'youth':
      return 'For Youth';
    case 'community':
      return 'Community';
    case 'team':
      return 'Group of 4 runners';
    case 'duo':
      return 'Group of 2 runners';
    case 'founders':
      return 'Founders Club';
    default:
      return null;
  }
}

function isPremiumRaceCardHighlight(h?: RaceCategoryDefinition['highlight']) {
  return h === 'team' || h === 'duo' || h === 'founders';
}

type RaceCategoriesSectionProps = {
  onSelectCategory?: (categoryName: string) => void;
  onOpenRaceEventsDetails?: () => void;
};

export default function RaceCategoriesSection({ onSelectCategory, onOpenRaceEventsDetails }: RaceCategoriesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const headerOffset = 80; // match fixed header height

  const scrollToRegistration = () => {
    const registrationSection = document.getElementById('registration');
    if (registrationSection) {
      const elementPosition = registrationSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const scrollToRaceExperience = () => {
    const raceExperience = document.getElementById('race-experience');
    if (raceExperience) {
      const elementPosition = raceExperience.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
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
        {/* Apparel gallery: marquee thumbnails, hover to pause & scale, click for modal */}
        <ApparelGallery isVisible={isVisible} />

        {/* Section Header */}
        <div
          className={`text-center mb-12 ${
            isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
          }`}
          style={{ animationDelay: '0.3s' }}
        >
          <button
            type="button"
            onClick={() => {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              if (isMobile) {
                window.open(SPEED_SERIES_PDF_URL, '_blank', 'noopener,noreferrer');
                return;
              }
              scrollToRaceExperience();
              onOpenRaceEventsDetails?.();
            }}
            className="inline-flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-full mb-4 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-100 border-2 border-white/20 hover:border-white/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
          >
            <img
              src="/images/running-man.gif"
              alt=""
              className="h-6 w-auto object-contain"
              width={24}
              height={24}
              aria-hidden
            />
            <span className="text-white font-semibold text-sm font-fira-sans uppercase tracking-wide">
              Mission Strong : Speed Series powered by 2XU. Race Event Details
            </span>
            <img
              src="/images/hand-pointer.gif"
              alt=""
              className="h-8 w-auto object-contain shrink-0"
              width={32}
              height={32}
              aria-hidden
            />
          </button>
          <h2 id="race-experience" className="text-4xl lg:text-5xl font-bold text-white mb-4 font-druk drop-shadow-lg scroll-mt-24">
            Choose Your Race Experience
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full shadow-md mb-4" />
          <p className="text-gray-200 max-w-2xl mx-auto font-sweet-sans text-lg mb-6">
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
                className={`group relative h-full rounded-2xl border backdrop-blur-md p-6 lg:p-7 shadow-2xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isPremiumRaceCardHighlight(category.highlight)
                    ? 'border-orange-400/70 bg-gradient-to-br from-orange-500/20 via-white/5 to-yellow-500/15 hover:border-orange-400 hover:shadow-xl'
                    : 'border-white/10 bg-white/5 hover:border-orange-400/80 hover:bg-white/10'
                } ${isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
                style={{ animationDelay: `${0.45 + index * 0.07}s` }}
              >
                {/* Glow accent */}
                <div className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                  isPremiumRaceCardHighlight(category.highlight)
                    ? 'opacity-100 bg-gradient-to-br from-orange-500/20 via-transparent to-yellow-400/15'
                    : 'opacity-0 group-hover:opacity-100 bg-gradient-to-br from-orange-500/15 via-transparent to-yellow-400/10'
                }`} />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white font-druk">
                        {category.name}
                      </h3>
                      <p className={`mt-1 text-sm font-sweet-sans ${isPremiumRaceCardHighlight(category.highlight) ? 'text-orange-300 font-semibold' : 'text-gray-300'}`}>
                        {category.ageGroup}
                      </p>
                    </div>
                    {highlightLabel && (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-fira-sans uppercase tracking-wide shadow-md ${
                          isPremiumRaceCardHighlight(category.highlight)
                            ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white ring-2 ring-orange-300/50'
                            : category.highlight === 'best-value'
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-orange-500 text-white'
                        }`}
                      >
                        {(category.highlight === 'team' || category.highlight === 'duo') && (
                          <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        )}
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
                  {category.name === 'Mission Strong Founders Club' ? (
                    <div className="mt-2 space-y-3 text-left">
                      <div className="rounded-xl border border-orange-400/50 bg-gradient-to-br from-orange-500/20 to-black/40 p-4 shadow-inner">
                        <p className="text-sm font-bold tracking-wide text-white font-druk mb-3">FOUNDERS CLUB INCLUDES</p>
                        <ul className="space-y-2.5 text-sm text-gray-100 font-sweet-sans leading-snug">
                          <li className="flex gap-2">
                            <span className="shrink-0" aria-hidden>
                              ⚡
                            </span>
                            <span>Access to 3 legs of the Speed Series</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="shrink-0" aria-hidden>
                              🎁
                            </span>
                            <span>Exclusive perks from 2XU and One of a Kind Asia by-invite events</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="shrink-0" aria-hidden>
                              🏁
                            </span>
                            <span>Plus access to 3 races free</span>
                          </li>
                        </ul>
                        <p className="mt-3 text-xs text-gray-400 font-sweet-sans border-t border-white/10 pt-3">
                          Bundle for runners committing to three legs ahead. Final entitlements subject to event
                          confirmation.
                        </p>
                      </div>
                    </div>
                  ) : category.name === 'Patron' ? (
                    <div className="mt-2 space-y-3 text-left">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-orange-300 font-fira-sans">
                          Speed options
                        </p>
                        <p className="mt-1 text-sm text-gray-100 font-sweet-sans">
                          2KM · 5KM · 10KM · 21KM
                        </p>
                      </div>
                      <div className="rounded-xl border border-orange-400/50 bg-gradient-to-br from-orange-500/20 to-black/40 p-4 shadow-inner">
                        <p className="text-sm font-bold tracking-wide text-white font-druk mb-3">PATRONS UNLOCK</p>
                        <ul className="space-y-2.5 text-sm text-gray-100 font-sweet-sans leading-snug">
                          <li className="flex gap-2">
                            <span className="shrink-0" aria-hidden>
                              🏅
                            </span>
                            <span>Exclusive perks from Speed Series</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="shrink-0" aria-hidden>
                              🏅
                            </span>
                            <span>Exclusive 2XU Gear</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="shrink-0" aria-hidden>
                              🏅
                            </span>
                            <span>Official Timing by Prospex Seiko</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="shrink-0" aria-hidden>
                              🏅
                            </span>
                            <span>Mission Strong Founders Club Eligibility</span>
                          </li>
                        </ul>
                        <p className="mt-3 text-xs text-gray-400 font-sweet-sans border-t border-white/10 pt-3">
                          VIP access, after-run concert, and recovery village — final entitlements subject to event
                          confirmation.
                        </p>
                      </div>
                    </div>
                  ) : (
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
                          {category.kitFooterNote ??
                            'Includes official 2XU jersey race kit. Final designs and contents may vary.'}
                        </p>
                      </div>
                    </div>
                  )}

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
          style={{ animationDelay: '1s' }}
        >
          All pricing is indicative and may be subject to final confirmation. Race kits and entitlements are curated
          to deliver a Mission Strong : speed series Experience powered by 2XU.
        </p>

        {/* Mission Strong image - end of section */}
        {/* <div
          className={`mt-10 flex justify-center max-w-2xl mx-auto overflow-hidden rounded-2xl ${
            isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
          }`}
          style={{ animationDelay: '1.1s' }}
        >
          <Image
            src="/images/mission_strong.jpeg"
            alt="Mission Strong"
            width={800}
            height={450}
            className="w-full rounded-2xl shadow-xl object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div> */}
      </div>
    </section>
  );
}

