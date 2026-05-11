import HomePageClient from '@/components/HomePageClient';

export default function Home() {
  const promoBaguioLegEnabled = process.env.PROMO_BAGUIO_LEG === 'true';

  return <HomePageClient promoBaguioLegEnabled={promoBaguioLegEnabled} />;
}
