'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import UpdatesSection from '@/components/UpdatesSection';

type ExperienceItem = {
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  alt: string;
  location: string;
  date: string;
  status: 'completed' | 'upcoming' | 'tba';
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
    location: 'Ayala Triangle, Makati City',
    date: '17 May 2026',
    status: 'completed',
  },
  {
    name: 'By the Mountain',
    subtitle: 'Highland challenge route',
    description: 'Cool air, rolling climbs, and scenic elevations that test grit, focus, and endurance.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
    alt: 'Mountain landscape with winding road',
    location: 'Baguio City',
    date: '26 July 2026',
    status: 'upcoming',
  },
  {
    name: 'By the Sea',
    subtitle: 'Coastal sprint route',
    description: 'Open horizons, ocean breeze, and a smooth seaside course made for rhythm and speed.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    alt: 'Sea coastline landscape at sunset',
    location: 'TBC',
    date: 'TBC',
    status: 'tba',
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
          {EXPERIENCES.map((item, index) => {
            const isCompleted = item.status === 'completed';

            return (
            <article
              key={item.name}
              className={`group overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm ${
                isCompleted
                  ? 'border-white/5 bg-white/[0.03] opacity-90'
                  : 'border-white/10 bg-white/5'
              } ${isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
              style={{ animationDelay: `${0.25 + index * 0.1}s` }}
            >
              <div className="relative h-60 sm:h-64 overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.alt}
                  fill
                  className={`object-cover transition-transform duration-500 ${
                    isCompleted
                      ? 'grayscale-[0.65] brightness-75'
                      : 'group-hover:scale-105'
                  }`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${
                    isCompleted ? 'from-black/85 via-black/50' : 'from-black/70 via-black/20'
                  } to-transparent`}
                />
                {isCompleted && (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    aria-hidden
                  >
                    <span className="rotate-[-18deg] rounded-md border-4 border-yellow-400/90 bg-black/35 px-6 py-2 text-2xl font-druk font-bold uppercase tracking-[0.2em] text-yellow-400 shadow-lg backdrop-blur-[2px] sm:text-3xl">
                      Completed
                    </span>
                  </div>
                )}
                <div className="absolute left-4 bottom-4">
                  <p
                    className={`text-xs uppercase tracking-[0.2em] font-fira-sans ${
                      isCompleted ? 'text-yellow-400/70' : 'text-yellow-300'
                    }`}
                  >
                    {item.subtitle}
                  </p>
                  <h3
                    className={`text-2xl font-druk font-bold ${
                      isCompleted ? 'text-white/80' : 'text-white'
                    }`}
                  >
                    {item.name}
                  </h3>
                </div>
              </div>

              <div className="p-5">
                <p
                  className={`text-sm sm:text-base font-sweet-sans leading-relaxed ${
                    isCompleted ? 'text-gray-400' : 'text-gray-200'
                  }`}
                >
                  {item.description}
                </p>
                <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm font-sweet-sans">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className={`font-semibold ${isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                      Where:
                    </dt>
                    <dd className={isCompleted ? 'text-gray-400' : 'text-gray-200'}>{item.location}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className={`font-semibold ${isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                      Date:
                    </dt>
                    <dd className={isCompleted ? 'text-gray-400' : 'text-gray-200'}>{item.date}</dd>
                  </div>
                </dl>
              </div>
            </article>
            );
          })}
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
