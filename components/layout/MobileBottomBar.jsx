'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../Icon';
import { useAuthStore } from '../../store/authStore';

const STUDENT_TABS = [
  { to: '/student', label: 'Home', icon: 'dashboard', exact: true },
  { to: '/student/attendance', label: 'Attendance', icon: 'clipboard-check', feature: 'attendance' },
  { to: '/student/results', label: 'Results', icon: 'chart', feature: 'exams-results' },
  { to: '/student/fees', label: 'Fees', icon: 'dollar-circle', feature: 'fees' },
];

export function isFullscreenStudentPlayer(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith('/student/quizzes/') && pathname !== '/student/quizzes') {
    return true;
  }
  return false;
}

export default function MobileBottomBar({ role, onOpenMore }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [hasFullscreenAttr, setHasFullscreenAttr] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const check = () => {
      setHasFullscreenAttr(Boolean(document.querySelector('[data-fullscreen-player="true"]')));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-fullscreen-player'],
    });
    return () => observer.disconnect();
  }, [pathname]);

  if (role !== 'student') return null;
  if (isFullscreenStudentPlayer(pathname) || hasFullscreenAttr) return null;

  const effectiveFeatures =
    user?.college?.effectiveFeatures || user?.college?.subscription?.features || null;

  const visibleTabs = STUDENT_TABS.filter((tab) => {
    if (!tab.feature || !effectiveFeatures) return true;
    return effectiveFeatures.includes(tab.feature);
  });

  return (
    <nav
      aria-label="Student mobile navigation"
      data-mobile-bottom-bar="true"
      className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 h-18 px-2 pb-[env(safe-area-inset-bottom)] bg-b-surface2/95 backdrop-blur-md border-t border-s-stroke2 shadow-dropdown flex items-center justify-around"
    >
      {visibleTabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.to
          : pathname === tab.to || pathname?.startsWith(`${tab.to}/`);

        return (
          <Link
            key={tab.to}
            href={tab.to}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 min-w-15 h-14 px-2 rounded-2xl transition-colors ${
              isActive
                ? 'text-t-primary font-semibold'
                : 'text-t-secondary hover:text-t-primary'
            }`}
          >
            {isActive && (
              <span
                className="absolute top-1 w-6 h-1 rounded-full"
                style={{ background: 'var(--accent, var(--primary-01))' }}
                aria-hidden="true"
              />
            )}
            <Icon
              name={tab.icon}
              className={`!size-5 transition-colors ${
                isActive ? 'fill-[var(--accent,var(--primary-01))]' : 'fill-t-secondary'
              }`}
            />
            <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMore}
        aria-label="Open full navigation menu"
        className="relative flex flex-col items-center justify-center gap-1 min-w-15 h-14 px-2 rounded-2xl text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
      >
        <Icon name="grid" className="!size-5 fill-t-secondary" />
        <span className="text-[11px] leading-none tracking-tight">More</span>
      </button>
    </nav>
  );
}

