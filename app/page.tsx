'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);
  const eventsSectionRef = useRef<HTMLElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEventsVisible, setIsEventsVisible] = useState(false);
  
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

  // Cycle through images after each flash completes
  // Flash completes at 98% of 4s cycle, so change image right after flash (at 4s)
  useEffect(() => {
    let imageInterval: NodeJS.Timeout;
    
    // Initial delay to sync with first flash completion
    const initialTimeout = setTimeout(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % eventImages.length);
      
      // Then continue cycling every 4 seconds (after each flash)
      imageInterval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % eventImages.length);
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
                backgroundImage: `url(${eventImages[currentImageIndex]})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%',
                transition: 'background-size 1.5s ease-in-out, background-image 0.5s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundSize = '110% 110%';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundSize = '100% 100%';
              }}
            >
              {/* Black vertical stripe on right */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-black z-30 pointer-events-none"></div>
              
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

      {/* Mission & Vision Section */}
      <section id="mission-vision" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center font-fira-sans">Mission & Vision</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h3 className="text-2xl font-bold text-orange-600 mb-4 font-fira-sans">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed font-fira-sans">
                To pioneer Global Sports Development that inspires communities to pursue a brighter and sustainable future.<br/>  
                To Promote tourism, culture, and heritage through various events and open an economic gateway between Asia and the world. <br/>
                To prosper (fund) charitable institutions and sports development programs in underserved communities.<br/>
                To prepare and propel the next generation of athletes through sports discipline.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h3 className="text-2xl font-bold text-orange-600 mb-4 font-fira-sans">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed font-fira-sans">
              To become the pioneer Sports Innovation company in Asia, delivering world-class, first-to-market, and socially responsible events that inspire and unite communities and partners through the power of sports.
              </p>
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

