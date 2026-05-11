'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RaceExperienceGallerySection from '@/components/RaceExperienceGallerySection';
import EventsSection from '@/components/EventsSection';
import RaceCategoriesSection from '@/components/RaceCategoriesSection';
import MissionVisionSection from '@/components/MissionVisionSection';
import PartnersSection from '@/components/PartnersSection';
import FAQSection from '@/components/FAQSection';
import RegistrationSection from '@/components/RegistrationSection';
import Footer from '@/components/Footer';
import BackToRaceExperienceButton from '@/components/BackToRaceExperienceButton';
import SpeedSeriesMechanicsModal from '@/components/SpeedSeriesMechanicsModal';
import HomePromoSplash from '@/components/HomePromoSplash';

const REGISTRATION_SCROLL_OFFSET_PX = 80;

type HomePageClientProps = {
  promoBaguioLegEnabled: boolean;
};

export default function HomePageClient({ promoBaguioLegEnabled }: HomePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isMechanicsModalOpen, setIsMechanicsModalOpen] = useState(false);
  const clearSelectedCategory = useCallback(() => setSelectedCategory(''), []);

  const scrollToRegistration = useCallback(() => {
    const el = document.getElementById('registration');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - REGISTRATION_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  const handlePromoPatronImageClick = useCallback(() => {
    setSelectedCategory('Patron');
    scrollToRegistration();
  }, [scrollToRegistration]);

  return (
    <>
      {promoBaguioLegEnabled && (
        <HomePromoSplash onPatronImageClick={handlePromoPatronImageClick} />
      )}
      {/* 
        ============================================
        DEVELOPED BY: Andy Radam
        Contact: 09664665514
        Email: asriidev@gmail.com
        ============================================
      */}
      <main className="min-h-screen scroll-smooth">
        <Header />
        <Hero onOpenRaceEventsDetails={() => setIsMechanicsModalOpen(true)} />
        <RaceExperienceGallerySection />
        <EventsSection onOpenMechanicsModal={() => setIsMechanicsModalOpen(true)} />
        <RaceCategoriesSection
          onSelectCategory={setSelectedCategory}
          onOpenRaceEventsDetails={() => setIsMechanicsModalOpen(true)}
        />
        <MissionVisionSection />
        <PartnersSection />
        <FAQSection />
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
