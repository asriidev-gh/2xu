'use client';

import { useEffect, useState } from 'react';

export default function BackToRaceExperienceButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;

      // Show when user has scrolled down a bit and is near the lower half of the page
      const nearBottom = scrollY + viewportHeight > docHeight * 0.6;
      setIsVisible(nearBottom);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToRaceExperience = () => {
    const target = document.getElementById('race-categories');
    if (target) {
      const headerOffset = 80; // match fixed header height
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      // Fallback to top/hero if section not found
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      aria-label="Back to Race Experience section"
      onClick={scrollToRaceExperience}
      className="fixed bottom-6 right-4 md:right-6 z-50 md:hidden inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/95 border border-orange-400 shadow-lg shadow-orange-500/30 text-orange-600 hover:bg-orange-50 active:scale-95 transition-all"
    >
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

