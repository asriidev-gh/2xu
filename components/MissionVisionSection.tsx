'use client';

import { useEffect, useRef, useState } from 'react';

export default function MissionVisionSection() {
  const missionVisionSectionRef = useRef<HTMLElement>(null);
  const [isMissionVisionVisible, setIsMissionVisionVisible] = useState(false);

  // Trigger animations when Mission & Vision section comes into view, fade out when leaving
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if section is intersecting and has enough visibility
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsMissionVisionVisible(true);
          } else {
            setIsMissionVisionVisible(false);
          }
        });
      },
      { 
        threshold: [0, 0.1, 0.5, 1.0], // Multiple thresholds for better detection
        rootMargin: '-50px 0px -50px 0px' // Trigger slightly before fully in view
      }
    );

    if (missionVisionSectionRef.current) {
      observer.observe(missionVisionSectionRef.current);
    }

    return () => {
      if (missionVisionSectionRef.current) {
        observer.unobserve(missionVisionSectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      ref={missionVisionSectionRef} 
      id="mission-vision" 
      className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/mission-and-vision-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isMissionVisionVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full mb-4 shadow-lg">
            <span className="text-white font-semibold text-sm font-fira-sans uppercase tracking-wide">Our Foundation</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-4 font-druk drop-shadow-lg">
            Mission & Vision
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full shadow-md"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Mission Card */}
          <div className={`group relative ${isMissionVisionVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.4s' }}>
            <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-black/50 backdrop-blur-md rounded-2xl p-8 lg:p-10 shadow-2xl border border-white/30 hover:border-white/40 transition-all duration-300 h-full">
              {/* Icon/Number */}
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-3xl font-bold text-white font-druk">Our Mission</h3>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 mt-2"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                  <p className="text-white/95 leading-relaxed font-sweet-sans text-base">
                    To pioneer Global Sports Development that inspires communities to pursue a brighter and sustainable future.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                  <p className="text-white/95 leading-relaxed font-sweet-sans text-base">
                    To Promote tourism, culture, and heritage through various events and open an economic gateway between Asia and the world.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                  <p className="text-white/95 leading-relaxed font-sweet-sans text-base">
                    To prosper (fund) charitable institutions and sports development programs in underserved communities.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                  <p className="text-white/95 leading-relaxed font-sweet-sans text-base">
                    To prepare and propel the next generation of athletes through sports discipline.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vision Card */}
          <div className={`group relative ${isMissionVisionVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.6s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-black/50 backdrop-blur-md rounded-2xl p-8 lg:p-10 shadow-2xl border border-white/30 hover:border-white/40 transition-all duration-300 h-full">
              {/* Icon/Number */}
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-3xl font-bold text-white font-druk">Our Vision</h3>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 mt-2"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                <p className="text-white/95 leading-relaxed font-sweet-sans text-lg pl-6">
                  To become the pioneer Sports Innovation company in Asia, delivering world-class, first-to-market, and socially responsible events that inspire and unite communities and partners through the power of sports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

