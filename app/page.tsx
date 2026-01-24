'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);
  const eventsSectionRef = useRef<HTMLElement>(null);
  const missionVisionSectionRef = useRef<HTMLElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEventsVisible, setIsEventsVisible] = useState(false);
  const [isMissionVisionVisible, setIsMissionVisionVisible] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const eventImages = [
    '/images/events-runner.png',
    '/images/events-runner2.jpg',
    '/images/events-runner3.jpg',
    '/images/events-runner4.jpg'
  ];

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

  // Cycle through images after each flash completes with cube flip effect
  // Flash completes at 98% of 4s cycle, so change image right after flash (at 4s)
  useEffect(() => {
    let imageInterval: NodeJS.Timeout;
    
    const changeImage = () => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % eventImages.length);
        setTimeout(() => {
          setIsFlipping(false);
        }, 50);
      }, 400); // Change image at midpoint of flip (400ms of 800ms animation)
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
    <main className="min-h-screen scroll-smooth">
      <Header />
      <Hero />
      
      {/* Events Section */}
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
              
              {/* Right Side - Summary Title */}
              <div className={`mt-4 lg:mt-0 lg:text-right ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                <h3 className="text-base lg:text-lg font-bold text-black mb-1 font-druk">
                  SUMMARY OF THE KEY DRIVERS
                </h3>
                <h3 className="text-base lg:text-lg font-bold text-gray-900 font-druk">
                  2XU ASIA RUN PROGRAM
                </h3>
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
              
              <div className="relative z-10">
                {/* Advocacy Section */}
                <div className={`mb-6 ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2 font-druk">Advocacy</h3>
                  <p className="text-gray-200 leading-relaxed font-sweet-sans text-sm lg:text-base">
                    Empower athletes in Asia through sports development and leadership training via One of A Kind Asia Sports and Leadership Training Academy.
                  </p>
                </div>

                {/* Event Highlights */}
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
            </div>

            {/* Right Section - Visual (1/3 width) - Hidden on mobile */}
            <div 
              ref={rightSectionRef} 
              className={`hidden lg:block lg:col-span-1 relative overflow-hidden group ${isEventsVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
              style={{ 
                animationDelay: '0.3s',
                minHeight: '400px',
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                backgroundColor: 'black'
              }}
            >
              {/* Cube container */}
              <div
                className="absolute inset-0"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)'
                }}
              >
                {/* Current image face */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${eventImages[currentImageIndex]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg) translateZ(0)'
                  }}
                ></div>
                {/* Next image face (behind) */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${eventImages[(currentImageIndex + 1) % eventImages.length]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(90deg) translateZ(0)'
                  }}
                ></div>
              </div>
              
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

      {/* Mission & Vision Section */}
      <section ref={missionVisionSectionRef} id="mission-vision" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          {/* Section Header */}
          <div className={`text-center mb-16 ${isMissionVisionVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="inline-block px-4 py-2 bg-orange-100 rounded-full mb-4">
              <span className="text-orange-600 font-semibold text-sm font-fira-sans uppercase tracking-wide">Our Foundation</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4 font-druk">
              Mission & Vision
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Mission Card */}
            <div className={`group relative ${isMissionVisionVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 lg:p-10 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 h-full">
                {/* Icon/Number */}
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-3xl font-bold text-gray-900 font-druk">Our Mission</h3>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 mt-2"></div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700 leading-relaxed font-sweet-sans text-base">
                      To pioneer Global Sports Development that inspires communities to pursue a brighter and sustainable future.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700 leading-relaxed font-sweet-sans text-base">
                      To Promote tourism, culture, and heritage through various events and open an economic gateway between Asia and the world.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700 leading-relaxed font-sweet-sans text-base">
                      To prosper (fund) charitable institutions and sports development programs in underserved communities.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700 leading-relaxed font-sweet-sans text-base">
                      To prepare and propel the next generation of athletes through sports discipline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vision Card */}
            <div className={`group relative ${isMissionVisionVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.6s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 lg:p-10 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 h-full">
                {/* Icon/Number */}
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-3xl font-bold text-gray-900 font-druk">Our Vision</h3>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 mt-2"></div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                  <p className="text-gray-700 leading-relaxed font-sweet-sans text-lg pl-6">
                    To become the pioneer Sports Innovation company in Asia, delivering world-class, first-to-market, and socially responsible events that inspire and unite communities and partners through the power of sports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center font-fira-sans">Partners</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Partner logos will go here */}
            <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Partner Logo</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Partner Logo</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Partner Logo</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Partner Logo</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

