'use client';

import { useEffect, useRef, useState } from 'react';

type EventsSectionProps = {
  onOpenMechanicsModal?: () => void;
};

export default function EventsSection({ onOpenMechanicsModal }: EventsSectionProps = {}) {
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);
  const eventsSectionRef = useRef<HTMLElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEventsVisible, setIsEventsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [currentCarouselPage, setCurrentCarouselPage] = useState(0);
  
  const eventImages = [
    '/images/events-runner2.jpg',
    '/images/events-runner3.jpg',
    '/images/events-runner4.jpg'
  ];

  // Match heights between left and right sections
  useEffect(() => {
    const matchHeights = () => {
      if (leftSectionRef.current && rightSectionRef.current) {
        const leftHeight = leftSectionRef.current.offsetHeight;
        // Set the right section height to match left section exactly
        rightSectionRef.current.style.height = `${leftHeight}px`;
        rightSectionRef.current.style.minHeight = `${leftHeight}px`;
      }
    };

    // Initial match - try multiple times to ensure it works
    matchHeights();
    setTimeout(matchHeights, 50);
    setTimeout(matchHeights, 200);
    setTimeout(matchHeights, 500);
    
    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      matchHeights();
    });

    if (leftSectionRef.current) {
      resizeObserver.observe(leftSectionRef.current);
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', matchHeights);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', matchHeights);
    };
  }, []);

  // Cycle through images after each flash completes with fast crossfade effect
  useEffect(() => {
    let imageInterval: NodeJS.Timeout;
    
    const changeImage = () => {
      // Start fade out
      setIsFading(true);
      // Change image quickly (at 30% of fade duration) to start crossfade
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % eventImages.length);
        // Immediately start fade in (overlapping with fade out)
        setTimeout(() => {
          setIsFading(false);
        }, 10);
      }, 90); // Change image at 90ms (30% of 300ms transition)
    };
    
    // Initial delay to sync with first flash completion
    const initialTimeout = setTimeout(() => {
      changeImage();
      
      // Then continue cycling every 4 seconds (after each flash)
      imageInterval = setInterval(() => {
        changeImage();
      }, 4000); // Change image every 4 seconds (right after flash completes)
    }, 4000); // First change after 4 seconds (when first flash completes)

    return () => {
      clearTimeout(initialTimeout);
      if (imageInterval) clearInterval(imageInterval);
    };
  }, [eventImages.length]);

  // Trigger animations when Events section comes into view, fade out when leaving
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if section is intersecting and has enough visibility
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsEventsVisible(true);
          } else {
            setIsEventsVisible(false);
          }
        });
      },
      { 
        threshold: [0, 0.1, 0.5, 1.0], // Multiple thresholds for better detection
        rootMargin: '-50px 0px -50px 0px' // Trigger slightly before fully in view
      }
    );

    if (eventsSectionRef.current) {
      observer.observe(eventsSectionRef.current);
    }

    return () => {
      if (eventsSectionRef.current) {
        observer.unobserve(eventsSectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={eventsSectionRef} id="events" className="py-8 px-0 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section with Background Image */}
        <div 
          className="relative w-full rounded-t-lg overflow-hidden mb-0"
          style={{
            minHeight: '150px',
            backgroundImage: 'url(/images/events-header-img.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Text Content */}
          <div className="relative z-10 p-4 lg:p-6 h-full flex flex-col lg:flex-row justify-between items-start lg:items-end">
            {/* Left Side - Program Title */}
            <div className={`flex-1 ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 font-druk leading-tight">
                PROGRAM:
              </h2>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 font-druk leading-tight">
                2XU SPEED RUN: ASIA SERIES
              </h2>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 font-druk leading-tight">
                WITH ONE OF A KIND EVENT HIGHLIGHT
              </h2>
            </div>
            
            {/* Right Side - Summary Title + Race Event Details button */}
            <div className={`mt-4 lg:mt-0 lg:text-right flex flex-col lg:items-end gap-3 ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              <div>
                <h3 className="text-base lg:text-lg font-bold text-black mb-1 font-druk">
                  SUMMARY OF THE KEY DRIVERS
                </h3>
                <h3 className="text-base lg:text-lg font-bold text-gray-900 font-druk">
                  2XU ASIA RUN PROGRAM
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onOpenMechanicsModal?.()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500 text-gray-900 font-semibold text-sm font-fira-sans hover:bg-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                <span>Race Event Details</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section - Left and Right Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 rounded-b-lg overflow-hidden shadow-2xl" style={{ gap: 0, minHeight: '500px' }}>
          {/* Left Section - Program Details (2/3 width) */}
          <div 
            ref={leftSectionRef} 
            className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 lg:p-8 relative overflow-hidden"
          >
            {/* Logo overlay - on top of gradient background */}
            <div 
              className="absolute z-0"
              style={{
                backgroundImage: 'url(/images/oneofakindasia-logo.png)',
                backgroundSize: 'contain',
                backgroundPosition: 'left bottom',
                backgroundRepeat: 'no-repeat',
                opacity: 0.07,
                left: 0,
                bottom: 0,
                width: '80%',
                height: '80%'
              }}
            ></div>
            
            <div className="relative z-10 h-full flex flex-col">
              {/* Carousel Container */}
              <div className="flex-1 relative overflow-hidden">
                {/* Carousel Slides */}
                <div 
                  className="flex transition-transform duration-500 ease-in-out h-full"
                  style={{ transform: `translateX(-${currentCarouselPage * 100}%)` }}
                >
                  {/* Slide 1: Advocacy & Event Highlights */}
                  <div className="min-w-full h-full flex flex-col px-2">
                    <div className={`mb-6 ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-2 font-druk">Advocacy</h3>
                      <p className="text-gray-200 leading-relaxed font-sweet-sans text-sm lg:text-base">
                        Empower athletes in Asia through sports development and leadership training via One of A Kind Asia Sports and Leadership Training Academy.
                      </p>
                    </div>

                    <div className={isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'} style={{ animationDelay: '0.6s' }}>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-4 font-druk">EVENT HIGHLIGHTS</h3>
                      <ul className="space-y-4">
                        <li className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.8s' }}>
                          <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                          <div className="flex-1">
                            <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-1">Pocket Events</h4>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Mini-events and activities for spectators and participants.</p>
                          </div>
                        </li>
                        <li className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '1s' }}>
                          <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                          <div className="flex-1">
                            <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-1">2XU Speed Run Competition</h4>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Athletes compete in Speed Run category.</p>
                          </div>
                        </li>
                        <li className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '1.2s' }}>
                          <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                          <div className="flex-1">
                            <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-1">One of A Kind Event Highlight</h4>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Premier event in Asia showcasing unique aspects of the run.</p>
                          </div>
                        </li>
                        <li className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '1.4s' }}>
                          <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                          <div className="flex-1">
                            <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-1">Leadership Training Sessions</h4>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Part of One of A Kind Asia Sports and Leadership Training Academy Program.</p>
                          </div>
                        </li>
                        <li className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '1.6s' }}>
                          <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                          <div className="flex-1">
                            <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-1">Networking Opportunities</h4>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Connect athletes with corporate partners and investors.</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Slide 2: Program Component */}
                  <div className="min-w-full h-full flex flex-col px-2">
                    <div className={`mb-6 ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-4 font-druk">PROGRAM COMPONENT</h3>
                    </div>
                    <div className="space-y-6">
                      <div className={`${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                        <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-2 flex items-start">
                          <span className="text-yellow-500 mr-2 font-bold text-lg">1.</span>
                          <span>2XU Speed Run: Asia Series</span>
                        </h4>
                        <ul className="ml-6 space-y-2">
                          <li className="flex items-start">
                            <span className="text-yellow-500 mr-2 mt-1 font-bold text-sm">-</span>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Premiere running event in Asia with athletes competing in Speed Run category.</p>
                          </li>
                          <li className="flex items-start">
                            <span className="text-yellow-500 mr-2 mt-1 font-bold text-sm">-</span>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Unique One of A Kind event highlight premiering in Asia.</p>
                          </li>
                        </ul>
                      </div>
                      <div className={`${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.8s' }}>
                        <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-2 flex items-start">
                          <span className="text-yellow-500 mr-2 font-bold text-lg">2.</span>
                          <span>One of A Kind Asia Sports and Leadership Training Academy</span>
                        </h4>
                        <ul className="ml-6 space-y-2">
                          <li className="flex items-start">
                            <span className="text-yellow-500 mr-2 mt-1 font-bold text-sm">-</span>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Hybrid training academy for coaches and athletes focusing on leadership skills and sustainable entrepreneurship paths.</p>
                          </li>
                          <li className="flex items-start">
                            <span className="text-yellow-500 mr-2 mt-1 font-bold text-sm">-</span>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Links athletes to corporate partners, equity builders, and investors.</p>
                          </li>
                        </ul>
                      </div>
                      <div className={`${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '1s' }}>
                        <h4 className="text-white font-bold font-druk text-base lg:text-lg mb-2 flex items-start">
                          <span className="text-yellow-500 mr-2 font-bold text-lg">3.</span>
                          <span>Athlete Empowerment</span>
                        </h4>
                        <ul className="ml-6 space-y-2">
                          <li className="flex items-start">
                            <span className="text-yellow-500 mr-2 mt-1 font-bold text-sm">-</span>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Equip athletes with leadership skills for careers beyond sports.</p>
                          </li>
                          <li className="flex items-start">
                            <span className="text-yellow-500 mr-2 mt-1 font-bold text-sm">-</span>
                            <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Create a platform for sports leaders and influencers in Asia.</p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Slide 3: Outcomes */}
                  <div className="min-w-full h-full flex flex-col px-2">
                    <div className={`mb-6 ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-4 font-druk">OUTCOMES</h3>
                    </div>
                    <div className="space-y-4">
                      <div className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                        <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                        <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Empower athletes in Asia with leadership skills.</p>
                      </div>
                      <div className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.8s' }}>
                        <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                        <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Develop sports leadership in Asia through One of A Kind Asia Sports and Leadership Training Academy.</p>
                      </div>
                      <div className={`flex items-start ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '1s' }}>
                        <span className="text-yellow-500 mr-3 mt-1 font-bold text-base flex-shrink-0">•</span>
                        <p className="text-gray-300 font-sweet-sans text-sm lg:text-base leading-relaxed">Promote 2XU Speed Run: Asia Series as a premier sports event.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                {/* Left Arrow */}
                <button
                  onClick={() => setCurrentCarouselPage((prev) => (prev === 0 ? 2 : prev - 1))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous slide"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Indicators */}
                <div className="flex space-x-2">
                  {[0, 1, 2].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentCarouselPage(page)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentCarouselPage === page
                          ? 'bg-yellow-500 w-8'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Go to slide ${page + 1}`}
                    />
                  ))}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => setCurrentCarouselPage((prev) => (prev === 2 ? 0 : prev + 1))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next slide"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Visual (1/3 width) - Hidden on mobile */}
          <div 
            ref={rightSectionRef} 
            className={`hidden lg:block lg:col-span-1 relative overflow-hidden group ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
            style={{ 
              animationDelay: '0.3s',
              minHeight: '400px',
              backgroundColor: 'black'
            }}
          >
            {/* Current image fading out */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${eventImages[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                opacity: isFading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
                zIndex: 1
              }}
            ></div>
            {/* Next image fading in (crossfade) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${eventImages[(currentImageIndex + 1) % eventImages.length]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                opacity: isFading ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                zIndex: 2
              }}
            ></div>
            
            {/* Shiny overlay effect - appears periodically */}
            <div 
              className="absolute inset-0 animate-shine z-40 pointer-events-none" 
              style={{ 
                background: 'linear-gradient(105deg, transparent 0%, transparent 15%, rgba(255,255,255,0.4) 35%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 65%, transparent 85%, transparent 100%)',
                width: '300%',
                height: '300%',
                top: '-100%',
                left: '-100%',
              }}
            ></div>
            
            {/* Pulse glow effect - appears periodically */}
            <div className="absolute inset-0 bg-yellow-400/30 blur-2xl animate-pulse-glow z-40 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

