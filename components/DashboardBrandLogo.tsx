'use client';

import Image from 'next/image';
import Link from 'next/link';

type DashboardBrandLogoProps = {
  /** Slightly larger logo on the main admin dashboard; default for Insights / Email blast. */
  variant?: 'default' | 'admin';
};

export default function DashboardBrandLogo({ variant = 'default' }: DashboardBrandLogoProps) {
  const imgClass =
    variant === 'admin'
      ? 'h-10 w-auto max-w-[min(220px,55vw)] object-contain object-left sm:h-11 sm:max-w-[240px] md:h-12 md:max-w-[280px]'
      : 'h-9 w-auto max-w-[min(200px,42vw)] object-contain object-left sm:h-10';

  return (
    <Link
      href="/"
      className="flex items-center shrink-0 min-w-0"
      aria-label="One of a Kind Asia — public site"
      title="One of a Kind Asia"
    >
      <Image
        src="/images/oneofakindasia-logo.png"
        alt="One of a Kind Asia"
        width={280}
        height={64}
        className={imgClass}
        priority
      />
    </Link>
  );
}
