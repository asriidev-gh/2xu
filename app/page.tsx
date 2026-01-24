'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import EventsSection from '@/components/EventsSection';
import MissionVisionSection from '@/components/MissionVisionSection';
import PartnersSection from '@/components/PartnersSection';
import RegistrationSection from '@/components/RegistrationSection';
import Footer from '@/components/Footer';

export default function Home() {
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
      <MissionVisionSection />
      <PartnersSection />
      <RegistrationSection />
      <Footer />
    </main>
    </>
  );
}
