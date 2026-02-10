'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
  e.preventDefault();
  const element = document.querySelector(targetId);
  if (element) {
    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/oneofakindasia-logo.png"
              alt="2XU Logo"
              width={50}
              height={50}
              className="w-auto max-h-12 md:max-h-14 object-contain object-left"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" onClick={(e) => smoothScroll(e, '#home')} className="text-gray-700 hover:text-orange-600 font-medium transition-colors font-fira-sans cursor-pointer">
              Home
            </a>
            <a href="#events" onClick={(e) => smoothScroll(e, '#events')} className="text-gray-700 hover:text-orange-600 font-medium transition-colors font-fira-sans cursor-pointer">
              Events
            </a>
            <a href="#mission-vision" onClick={(e) => smoothScroll(e, '#mission-vision')} className="text-gray-700 hover:text-orange-600 font-medium transition-colors font-fira-sans cursor-pointer">
              Mission & Vision
            </a>
            <a href="#partners" onClick={(e) => smoothScroll(e, '#partners')} className="text-gray-700 hover:text-orange-600 font-medium transition-colors font-fira-sans cursor-pointer">
              Partners
            </a>
            <button 
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('registration');
                if (element) {
                  const headerOffset = 80;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className="bg-orange-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-700 transition-colors font-fira-sans"
            >
              Join Now
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a href="#home" onClick={(e) => { smoothScroll(e, '#home'); setIsMenuOpen(false); }} className="block text-gray-700 hover:text-orange-600 font-medium font-fira-sans">
              Home
            </a>
            <a href="#events" onClick={(e) => { smoothScroll(e, '#events'); setIsMenuOpen(false); }} className="block text-gray-700 hover:text-orange-600 font-medium font-fira-sans">
              Events
            </a>
            <a href="#mission-vision" onClick={(e) => { smoothScroll(e, '#mission-vision'); setIsMenuOpen(false); }} className="block text-gray-700 hover:text-orange-600 font-medium font-fira-sans">
              Mission & Vision
            </a>
            <a href="#partners" onClick={(e) => { smoothScroll(e, '#partners'); setIsMenuOpen(false); }} className="block text-gray-700 hover:text-orange-600 font-medium font-fira-sans">
              Partners
            </a>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                const element = document.getElementById('registration');
                if (element) {
                  const headerOffset = 80;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className="w-full bg-orange-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-700 transition-colors font-fira-sans"
            >
              Join Now
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

