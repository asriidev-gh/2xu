'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import UpdatesSection from '@/components/UpdatesSection';

type ExperienceItem = {
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  alt: string;
};

type RaceExperienceGallerySectionProps = {
  suppressUpdatesPromoPreview?: boolean;
};

const EXPERIENCES: ExperienceItem[] = [
  {
    name: 'By the City',
    subtitle: 'Urban speed route',
    description: 'Fast streets, electric crowd energy, and a race-day atmosphere built for personal bests.',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80',
    alt: 'City skyline and urban running route',
  },
  {
    name: 'By the Mountain',
    subtitle: 'Highland challenge route',
    description: 'Cool air, rolling climbs, and scenic elevations that test grit, focus, and endurance.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
    alt: 'Mountain landscape with winding road',
  },
  {
    name: 'By the Sea',
    subtitle: 'Coastal sprint route',
    description: 'Open horizons, ocean breeze, and a smooth seaside course made for rhythm and speed.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    alt: 'Sea coastline landscape at sunset',
  },
];

const PARTICLES = [
  { left: '6%', top: '18%', size: 7, delay: 0.1, duration: 5.6 },
  { left: '13%', top: '62%', size: 10, delay: 0.7, duration: 6.1 },
  { left: '22%', top: '34%', size: 6, delay: 0.3, duration: 5.2 },
  { left: '31%', top: '12%', size: 9, delay: 1.1, duration: 6.7 },
  { left: '38%', top: '74%', size: 8, delay: 0.5, duration: 5.9 },
  { left: '47%', top: '45%', size: 7, delay: 1.4, duration: 6.2 },
  { left: '54%', top: '20%', size: 11, delay: 0.2, duration: 7.1 },
  { left: '61%', top: '67%', size: 6, delay: 0.9, duration: 5.4 },
  { left: '69%', top: '30%', size: 9, delay: 1.6, duration: 6.5 },
  { left: '76%', top: '55%', size: 8, delay: 0.4, duration: 6.3 },
  { left: '83%', top: '16%', size: 7, delay: 1.2, duration: 5.8 },
  { left: '91%', top: '72%', size: 10, delay: 0.8, duration: 6.9 },
];

export default function RaceExperienceGallerySection({
  suppressUpdatesPromoPreview = false,
}: RaceExperienceGallerySectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.1);
      },
      {
        threshold: [0, 0.1, 0.5],
        rootMargin: '-40px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="race-experience-gallery"
      className="relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-950 to-gray-900"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-yellow-500/20 blur-3xl" />
        {PARTICLES.map((particle, index) => (
          <motion.span
            key={`${particle.left}-${particle.top}-${index.toString()}`}
            className="absolute rounded-full bg-orange-300/60 shadow-[0_0_12px_rgba(251,146,60,0.5)]"
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            initial={{ opacity: 0.2, y: 0, scale: 0.9 }}
            animate={{ opacity: [0.2, 0.75, 0.25], y: [0, -14, 0], scale: [0.9, 1.1, 0.95] }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div
          className={`text-center mb-10 sm:mb-12 ${
            isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
          }`}
          style={{ animationDelay: '0.15s' }}
        >
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-yellow-400 font-fira-sans mb-2">
            Choose your race experience
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-druk font-bold text-white leading-tight">
            By the City, By the Mountain, By the Sea
          </h2>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {EXPERIENCES.map((item, index) => (
            <article
              key={item.name}
              className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl ${
                isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
              }`}
              style={{ animationDelay: `${0.25 + index * 0.1}s` }}
            >
              <div className="relative h-60 sm:h-64 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute left-4 bottom-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-300 font-fira-sans">
                    {item.subtitle}
                  </p>
                  <h3 className="text-2xl font-druk font-bold text-white">
                    {item.name}
                  </h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-sm sm:text-base text-gray-200 font-sweet-sans leading-relaxed">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div
          className={`mt-10 sm:mt-12 ${
            isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'
          }`}
          style={{ animationDelay: '0.6s' }}
        >
          <UpdatesSection suppressPromoPreview={suppressUpdatesPromoPreview} />
        </div>
      </div>
    </section>
  );
}
