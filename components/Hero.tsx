'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

// Slot machine count-up component
function CountUp({ end, suffix = '', duration = 2000, delay = 0 }: { end: number; suffix?: string; duration?: number; delay?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  return <span>{formatNumber(count)}{suffix}</span>;
}

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 w-screen">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ 
            objectFit: 'cover',
            width: '100vw',
            height: '100vh',
            minWidth: '100%',
            minHeight: '100%'
          }}
        >
          <source src="/images/2xu_banner_vid.mp4" type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        {/* Cover watermark in bottom right */}
        <div className="absolute bottom-0 right-0 w-32 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-orange-600/90 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
            INVITATIONAL
          </div>

          {/* Speed Run Image */}
          <div className="mb-10 flex justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Image
              src="/images/speed_run_img.png"
              alt="Speed Run"
              width={400}
              height={200}
              className="w-auto h-auto max-w-full"
              priority
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <span className="block text-yellow-500 font-druk">SAVE THE DATE</span>
            {/* Subheading */}
            <p className="text-xl sm:text-1xl text-gray-200 mb-4 max-w-2xl mx-auto font-sweet-sans">
                PUSH YOUR PACE, TEST YOUR LIMITS
            </p>
          </h1>

          <div className="inline-block px-6 py-4 mb-4 border-2 border-white rounded-lg bg-white/10 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="text-xl sm:text-2xl text-white font-sweet-sans">
              AYALA TRIANGLE, MAKATI<br/>
              <p>
                  JAN <span className='text-yellow-500'>26th</span> 2026
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col mt-4 sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '1s' }}>
            <button className="w-full sm:w-auto bg-yellow-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-700 transition-all transform hover:scale-105 shadow-lg">
              Register Here
            </button>
            <button className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-all">
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                <CountUp end={10000} suffix="+" duration={2000} delay={1200} />
              </div>
              <div className="text-gray-300">Active Runners</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                <CountUp end={50} suffix="+" duration={2000} delay={1400} />
              </div>
              <div className="text-gray-300">Events Yearly</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                <CountUp end={15} suffix="+" duration={2000} delay={1600} />
              </div>
              <div className="text-gray-300">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                <CountUp end={100} suffix="+" duration={2000} delay={1800} />
              </div>
              <div className="text-gray-300">Awards Won</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

