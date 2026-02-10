'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import EventsSection from '@/components/EventsSection';
import RaceCategoriesSection from '@/components/RaceCategoriesSection';
import MissionVisionSection from '@/components/MissionVisionSection';
import PartnersSection from '@/components/PartnersSection';
import RegistrationSection from '@/components/RegistrationSection';
import Footer from '@/components/Footer';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const clearSelectedCategory = useCallback(() => setSelectedCategory(''), []);

  return (
    <>
      {/* 
        ============================================
        DEVELOPED BY: Andy Radam
        Contact: 09664665514
        Email: asriidev@gmail.com
        ============================================
      */}
      <main className="min-h-screen scroll-smooth">
      <Header />
      <Hero />
      <EventsSection />
      <RaceCategoriesSection onSelectCategory={setSelectedCategory} />
      <MissionVisionSection />
      <PartnersSection />
      <RegistrationSection
        selectedCategory={selectedCategory}
        onCategoryApplied={clearSelectedCategory}
      />
      <Footer />
    </main>
    </>
  );
}
