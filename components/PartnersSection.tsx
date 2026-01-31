'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

export default function PartnersSection() {
  const partnersSectionRef = useRef<HTMLElement>(null);
  const [isPartnersVisible, setIsPartnersVisible] = useState(false);

  const handlePartnerWithUs = () => {
    Swal.fire({
      title: 'Partner With Us',
      html: `
        <p class="text-gray-600 text-left mb-4 font-sweet-sans">Tell us about your interest in partnering with 2XU Speed Run Asia Series.</p>
        <input id="partner-name" class="swal2-input w-full mb-3" placeholder="Your name" required>
        <input id="partner-email" class="swal2-input w-full mb-3" type="email" placeholder="Your email" required>
        <input id="partner-company" class="swal2-input w-full mb-3" placeholder="Company (optional)">
        <textarea id="partner-message" class="swal2-textarea w-full" placeholder="Your message" rows="4" required></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Send inquiry',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ea580c',
      preConfirm: () => {
        const name = (document.getElementById('partner-name') as HTMLInputElement)?.value?.trim();
        const email = (document.getElementById('partner-email') as HTMLInputElement)?.value?.trim();
        const company = (document.getElementById('partner-company') as HTMLInputElement)?.value?.trim();
        const message = (document.getElementById('partner-message') as HTMLTextAreaElement)?.value?.trim();
        if (!name || !email || !message) {
          Swal.showValidationMessage('Please fill in name, email, and message');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Please enter a valid email address');
          return false;
        }
        return { name, email, company, message };
      },
    }).then(async (result) => {
      if (!result.isConfirmed || !result.value) return;
      const payload = result.value;
      try {
        Swal.fire({ title: 'Sending...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const res = await fetch('/api/partner-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 503) {
            Swal.fire({
              icon: 'warning',
              title: 'Email not configured',
              text: data.error || 'Partner inquiry emails are not set up yet. Please contact us directly.',
              footer: '<a href="mailto:1@oneofakindasia.com?subject=Partner%20Inquiry%20-%202XU%20Speed%20Run">Email us</a>',
            });
            return;
          }
          throw new Error(data.error || 'Failed to send');
        }
        Swal.fire({ icon: 'success', title: 'Inquiry sent!', text: 'We\'ll get back to you soon.' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Could not send', text: err instanceof Error ? err.message : 'Something went wrong.' });
      }
    });
  };

  const partners = [
    { name: 'Ayala', image: '/images/partner-ayala.png' },
    { name: 'Garmin', image: '/images/partner-garmin.png' },
    { name: 'Mastercard', image: '/images/partner-mastercard.png' },
    { name: 'Pocari Sweat', image: '/images/partner-pocarisweat.webp' },
    { name: 'Union', image: '/images/partner-union.webp' },
  ];

  // Trigger animations when Partners section comes into view
  useEffect(() => {
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

    if (partnersSectionRef.current) {
      observer.observe(partnersSectionRef.current);
    }

    return () => {
      if (partnersSectionRef.current) {
        observer.unobserve(partnersSectionRef.current);
      }
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
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
          {partners.map((partner, index) => (
            <div
              key={partner.name}
              className={`group relative ${isPartnersVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`}
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              {/* Card with gradient glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              
              {/* Partner Card */}
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 h-full flex flex-col items-center justify-center min-h-[180px] group-hover:scale-105">
                {/* Partner Logo */}
                <div className="relative w-full h-24 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                  <Image
                    src={partner.image}
                    alt={`${partner.name} logo`}
                    width={120}
                    height={80}
                    className="object-contain max-w-full max-h-full"
                    style={{ filter: 'brightness(0.9)' }}
                  />
                </div>
                
                {/* Partner Name */}
                <h3 className="mt-4 text-sm font-semibold text-gray-700 font-fira-sans text-center group-hover:text-orange-600 transition-colors">
                  {partner.name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className={`mt-16 text-center ${isPartnersVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.8s' }}>
          <p className="text-gray-600 mb-6 font-sweet-sans text-lg">
            Interested in becoming a partner?
          </p>
          <button
            type="button"
            onClick={handlePartnerWithUs}
            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-700 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg font-fira-sans"
          >
            Partner With Us
          </button>
        </div>
      </div>
    </section>
  );
}
