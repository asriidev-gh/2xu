'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function Home() {
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);

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
  return (
    <main className="min-h-screen scroll-smooth">
      <Header />
      <Hero />
      
      {/* Events Section */}
      <section id="events" className="py-8 px-0 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 rounded-lg overflow-hidden shadow-2xl" style={{ gap: 0 }}>
            {/* Left Section - Program Details (2/3 width) */}
            <div ref={leftSectionRef} className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 lg:p-6">
              <div className="relative z-10">
                {/* Program Title */}
                <h2 className="text-xl lg:text-1xl font-bold text-white mb-3 font-druk leading-tight">
                  PROGRAM:<br/> 2XU SPEED RUN: ASIA SERIES WITH ONE OF A KIND EVENT HIGHLIGHT
                </h2>

                {/* Advocacy Section */}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white mb-1.5 font-druk">Advocacy</h3>
                  <p className="text-gray-200 leading-relaxed font-sweet-sans text-xs">
                    Empower athletes in Asia through sports development and leadership training via One of A Kind Asia Sports and Leadership Training Academy.
                  </p>
                </div>

                {/* Event Highlights */}
                <div>
                  <h3 className="text-base font-bold text-white mb-3 font-druk">EVENT HIGHLIGHTS</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold text-sm flex-shrink-0">•</span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold font-druk text-sm mb-0.5">Pocket Events</h4>
                        <p className="text-gray-300 font-sweet-sans text-xs leading-relaxed">Mini-events and activities for spectators and participants.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold text-sm flex-shrink-0">•</span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold font-druk text-sm mb-0.5">2XU Speed Run Competition</h4>
                        <p className="text-gray-300 font-sweet-sans text-xs leading-relaxed">Athletes compete in Speed Run category.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold text-sm flex-shrink-0">•</span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold font-druk text-sm mb-0.5">One of A Kind Event Highlight</h4>
                        <p className="text-gray-300 font-sweet-sans text-xs leading-relaxed">Premier event in Asia showcasing unique aspects of the run.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold text-sm flex-shrink-0">•</span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold font-druk text-sm mb-0.5">Leadership Training Sessions</h4>
                        <p className="text-gray-300 font-sweet-sans text-xs leading-relaxed">Part of One of A Kind Asia Sports and Leadership Training Academy Program.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold text-sm flex-shrink-0">•</span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold font-druk text-sm mb-0.5">Networking Opportunities</h4>
                        <p className="text-gray-300 font-sweet-sans text-xs leading-relaxed">Connect athletes with corporate partners and investors.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Section - Visual (1/3 width) */}
            <div 
              ref={rightSectionRef} 
              className="lg:col-span-1 relative overflow-hidden"
              style={{ 
                minHeight: '400px',
                backgroundImage: 'url(/images/events-runner.png)',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%'
              }}
            >
              {/* Black vertical stripe on right */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-black z-30 pointer-events-none"></div>
              
              {/* Shiny overlay effect - appears periodically */}
              <div 
                className="absolute inset-0 animate-shine z-40 pointer-events-none" 
                style={{ 
                  background: 'linear-gradient(105deg, transparent 0%, transparent 20%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.3) 60%, transparent 80%, transparent 100%)',
                  width: '200%',
                  height: '200%',
                  top: '-50%',
                  left: '-50%',
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

