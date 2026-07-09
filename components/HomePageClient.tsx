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
const BAGUIO_PROMO_2XU_URL =
  'https://ph.2xu.com/?utm_source=SpeedSeries&utm_medium=referral&utm_campaign=SpeedSeries_20Off&utm_id=SPEEDSERIES20&utm_content=event_registration&fbclid=IwY2xjawS8BDpleHRuA2FlbQIxMABicmlkETE0bmFLNzhub01FTVhlWjJhc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHi45yvzjCT6M3D9ywI5q6nooj95J3R8ZEf84hxEPbxAk1bggXKmrfKSwAtPq_aem_qsYGkP-U4hTUIQP3MsE3mQ';

type HomePageClientProps = {
  promoBaguioLegEnabled: boolean;
};

export default function HomePageClient({ promoBaguioLegEnabled }: HomePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isMechanicsModalOpen, setIsMechanicsModalOpen] = useState(false);
  const [homePromoDismissed, setHomePromoDismissed] = useState(!promoBaguioLegEnabled);
  const clearSelectedCategory = useCallback(() => setSelectedCategory(''), []);

  const handleHomePromoOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setHomePromoDismissed(true);
    }
  }, []);

  const scrollToRegistration = useCallback(() => {
    const el = document.getElementById('registration');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - REGISTRATION_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  const handlePromoPatronImageClick = useCallback(() => {
    setSelectedCategory('Patron');
    window.open(BAGUIO_PROMO_2XU_URL, '_blank', 'noopener,noreferrer');
    requestAnimationFrame(() => scrollToRegistration());
  }, [scrollToRegistration]);

  return (
    <>
      {promoBaguioLegEnabled && (
        <HomePromoSplash
          onPatronImageClick={handlePromoPatronImageClick}
          onOpenChange={handleHomePromoOpenChange}
        />
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
        <RaceExperienceGallerySection
          suppressUpdatesPromoPreview={promoBaguioLegEnabled && !homePromoDismissed}
        />
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
