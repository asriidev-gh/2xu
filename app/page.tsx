'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import EventsSection from '@/components/EventsSection';
import MissionVisionSection from '@/components/MissionVisionSection';
import PartnersSection from '@/components/PartnersSection';
import RegistrationSection from '@/components/RegistrationSection';

export default function Home() {
  return (
    <main className="min-h-screen scroll-smooth">
      <Header />
      <Hero />
      <EventsSection />
      <MissionVisionSection />
      <PartnersSection />
      <RegistrationSection />
    </main>
  );
}
