'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Partner = {
  name: string;
  image: string;
  url?: string;
};

export default function PartnersSection() {
  const partnersSectionRef = useRef<HTMLElement>(null);
  const [isPartnersVisible, setIsPartnersVisible] = useState(false);
  const [marqueePaused, setMarqueePaused] = useState(false);

  const partners: Partner[] = [
    { name: '2XU', image: '/images/2xu-logo.avif', url: 'https://ph.2xu.com/' },
    { name: 'Mastercard', image: '/images/partner-mastercard.png' },
    { name: 'Pocari Sweat', image: '/images/partner-pocarisweat.webp' },
    { name: 'Without Limits', image: '/images/partner-withoutlimits.jpg' },
    { name: 'Seiko', image: '/images/partner-seiko.png' },
    { name: 'Prospex', image: '/images/partner-prospex.png' },
  ];

  // Trigger animations when Partners section comes into view
  useEffect(() => {
    const target = partnersSectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsPartnersVisible(true);
          } else {
            setIsPartnersVisible(false);
          }
        });
      },
      { 
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, []);

  return (
    <section 
      ref={partnersSectionRef} 
      id="partners" 
      className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-20 w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-yellow-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isPartnersVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full mb-4 shadow-lg">
            <span className="text-white font-semibold text-sm font-fira-sans uppercase tracking-wide">Our Partners</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4 font-druk drop-shadow-sm">
            Partners & Sponsors
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto font-sweet-sans text-lg">
            Proudly supported by industry leaders who share our passion for sports excellence
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 font-fira-sans sm:text-base">
              Presented by
            </span> */}
            <a
              href="https://ph.2xu.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              aria-label="2XU Philippines — opens in new tab"
            >
              <span className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 ring-1 ring-white/15 shadow-md sm:px-6 sm:py-3.5">
                <Image
                  src="/images/speed_run2.png"
                  alt=""
                  width={840}
                  height={560}
                  className="h-24 w-auto object-contain object-center drop-shadow sm:h-28"
                />
              </span>
            </a>
          </div>
        </div>

        {/* Partners marquee: scroll left to right; pause on hover so links are easy to use */}
        <div
          className={`relative w-full overflow-hidden py-8 ${isPartnersVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
          style={{ animationDelay: '0.3s' }}
          onMouseEnter={() => setMarqueePaused(true)}
          onMouseLeave={() => setMarqueePaused(false)}
        >
          <div
            className={`flex w-max gap-6 lg:gap-8 animate-marquee-ltr items-stretch ${marqueePaused ? 'pause' : ''}`}
            style={{ width: 'max-content' }}
          >
            {[...partners, ...partners].map((partner, i) => (
              <div key={`${partner.name}-${i}`} className="group relative flex-shrink-0 w-[200px] lg:w-[240px] my-2">
                {/* Card with gradient glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 pointer-events-none" />
                {/* Partner Card */}
                {partner.url ? (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    aria-label={`Visit ${partner.name} Philippines (opens in new tab)`}
                  >
                    <div className="relative w-full h-24 flex items-center justify-center">
                      <Image
                        src={partner.image}
                        alt=""
                        width={120}
                        height={80}
                        className="object-contain max-w-full max-h-full"
                      />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-gray-700 font-fira-sans text-center group-hover:text-orange-600 transition-colors">
                      {partner.name}
                    </h3>
                  </a>
                ) : (
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] group-hover:scale-105">
                    <div className="relative w-full h-24 flex items-center justify-center">
                      <Image
                        src={partner.image}
                        alt={`${partner.name} logo`}
                        width={120}
                        height={80}
                        className="object-contain max-w-full max-h-full"
                      />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-gray-700 font-fira-sans text-center group-hover:text-orange-600 transition-colors">
                      {partner.name}
                    </h3>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent z-10" />
        </div>

        {/* Call to Action */}
        <div className={`mt-16 text-center ${isPartnersVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.8s' }}>
          <p className="text-gray-600 mb-6 font-sweet-sans text-lg">
            Interested in becoming a partner?
          </p>
          <a
            href="mailto:1@oneofakindasia.com?subject=Partner%20With%20Us%20-%202XU%20Speed%20Run"
            className="inline-block bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg font-fira-sans"
          >
            Partner With Us
          </a>
        </div>
      </div>
    </section>
  );
}
