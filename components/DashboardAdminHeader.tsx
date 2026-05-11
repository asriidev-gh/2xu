'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardBrandLogo from '@/components/DashboardBrandLogo';

const navLinkBase =
  'inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-sm font-fira-sans font-medium transition-all duration-150 whitespace-nowrap';
const navLinkActive = 'bg-white text-orange-800 shadow-sm ring-1 ring-gray-200/90';
const navLinkIdle = 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70';

type DashboardAdminHeaderProps = {
  emailBlastEnabled: boolean;
  onLogout: () => void | Promise<void>;
};

export default function DashboardAdminHeader({ emailBlastEnabled, onLogout }: DashboardAdminHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/90 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <DashboardBrandLogo variant="admin" />
            <button
              type="button"
              onClick={() => void onLogout()}
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-fira-sans font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              Log out
            </button>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-gray-100/90 border border-gray-200/80 self-stretch sm:self-start"
            aria-label="Dashboard sections"
          >
            <Link
              href="/dashboard/insights"
              className={`${navLinkBase} ${pathname === '/dashboard/insights' ? navLinkActive : navLinkIdle}`}
              aria-current={pathname === '/dashboard/insights' ? 'page' : undefined}
            >
              Insights
            </Link>
            <Link
              href="/dashboard/registrants"
              className={`${navLinkBase} ${pathname === '/dashboard/registrants' ? navLinkActive : navLinkIdle}`}
              aria-current={pathname === '/dashboard/registrants' ? 'page' : undefined}
            >
              Registrants
            </Link>
            {emailBlastEnabled && (
              <Link
                href="/dashboard/email-blast"
                className={`${navLinkBase} ${pathname === '/dashboard/email-blast' ? navLinkActive : navLinkIdle}`}
                aria-current={pathname === '/dashboard/email-blast' ? 'page' : undefined}
              >
                Email blast
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
