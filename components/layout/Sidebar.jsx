'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '../../store/authStore';
import {
  HiOutlineViewGrid, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineCurrencyDollar,
  HiOutlineClipboardCheck, HiOutlineDocumentText, HiOutlineChartBar, HiOutlineSpeakerphone,
  HiOutlineCog, HiOutlineLogout, HiOutlineOfficeBuilding, HiOutlineX,
  HiOutlineShieldCheck, HiOutlineExclamation, HiOutlineCalendar, HiOutlineBookOpen,
  HiOutlineCollection, HiOutlineBriefcase, HiOutlineDocumentDuplicate, HiOutlineClock,
  HiOutlineClipboardList, HiOutlineLibrary, HiOutlineCash, HiOutlineIdentification,
  HiOutlineSparkles, HiOutlineNewspaper, HiOutlineTemplate, HiOutlineCloudUpload,
  HiOutlineStar, HiOutlineUser, HiOutlineTrash, HiOutlineQrcode, HiOutlineBeaker
} from 'react-icons/hi';
import { NAV } from './navConfig';

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const rawLinks = NAV[user?.role] || [];

  const effectiveFeatures = user?.college?.effectiveFeatures || user?.college?.subscription?.features || null;

  // Filter links based on college effective features
  const links = rawLinks.filter((link) => {
    if (user?.role === 'superAdmin') return true;
    if (link.divider) return true;
    if (!link.feature) return true;
    if (!effectiveFeatures) return true;
    return effectiveFeatures.includes(link.feature);
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
    if (onClose) onClose();
  };

  const roleLabels = {
    superAdmin: 'SUPER ADMIN',
    admin: 'ADMIN',
    registrar: 'REGISTRAR',
    accountant: 'ACCOUNTANT',
    principal: 'PRINCIPAL',
    teacher: 'TEACHER',
    student: 'STUDENT',
    employee: 'EMPLOYEE',
  };
  const roleLabel = roleLabels[user?.role] || '?';

  return (
    <aside
      className="sb h-full w-[var(--sb-w)] max-w-[86vw] border-r border-line"
      style={{ background: 'var(--sidebar)' }}
      data-compact="false"
    >
      {/* Logo + Brand */}
      <div className="sb-brand gap-2.5">
        <div className="relative h-9 w-9 shrink-0">
          <Image src="/logo.svg" alt="Collegeshub" fill className="object-contain" priority />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-none tracking-tight text-fg">Collegeshub</p>
          <p className="mt-1 truncate text-[10px] font-semibold tracking-widest text-accent">{roleLabel} Panel</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="hdr-btn sb-close lg:hidden"
        >
          <HiOutlineX />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sb-nav" aria-label="Main navigation">
        {links.map((link, idx) => {
          if (link.divider) {
            return (
              <div key={idx} className="sb-group-label">{link.label}</div>
            );
          }

          if (link.comingSoon) {
            return (
              <div
                key={link.to}
                className={`sb-item is-soon${link.sub ? ' is-sub' : ''}`}
                aria-disabled="true"
              >
                <span className="sb-icon"><link.icon aria-hidden="true" /></span>
                <span className="sb-label">{link.label}</span>
                <span className="sb-soon">Soon</span>
              </div>
            );
          }

          const isActive = link.sub
            ? pathname === link.to
            : link.to.split('/').length <= 2
              ? pathname === link.to
              : pathname.startsWith(link.to);

          return (
            <Link
              key={link.to}
              href={link.to}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={`sb-item${link.sub ? ' is-sub' : ''}`}
            >
              <span className="sb-icon"><link.icon aria-hidden="true" /></span>
              <span className="sb-label">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="sb-foot">
        <button
          type="button"
          onClick={handleLogout}
          className="sb-item mb-0 w-full cursor-pointer text-left hover:bg-bad/10 hover:text-bad"
        >
          <span className="sb-icon"><HiOutlineLogout aria-hidden="true" /></span>
          <span className="sb-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;