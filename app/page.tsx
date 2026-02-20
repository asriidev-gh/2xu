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
import BackToRaceExperienceButton from '@/components/BackToRaceExperienceButton';
import SpeedSeriesMechanicsModal from '@/components/SpeedSeriesMechanicsModal';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isMechanicsModalOpen, setIsMechanicsModalOpen] = useState(false);
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
        <EventsSection onOpenMechanicsModal={() => setIsMechanicsModalOpen(true)} />
        <RaceCategoriesSection
          onSelectCategory={setSelectedCategory}
          onOpenRaceEventsDetails={() => setIsMechanicsModalOpen(true)}
        />
        <MissionVisionSection />
        <PartnersSection />
        <RegistrationSection
          selectedCategory={selectedCategory}
          onCategoryApplied={clearSelectedCategory}
        />
        <Footer />
        {/* Mobile-only floating back-to-race-experience button */}
        <BackToRaceExperienceButton />
      </main>
      <SpeedSeriesMechanicsModal
        isOpen={isMechanicsModalOpen}
        onClose={() => setIsMechanicsModalOpen(false)}
      />
    </>
  );
}
