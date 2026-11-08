'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../providers/ThemeProvider';
import Icon from '../Icon';
import PlanBadge from '../common/PlanBadge';
import { NAV } from './navConfig';

const ROLE_LABELS = {
  superAdmin: 'Platform Command Center',
  admin: 'College Admin',
  registrar: 'Registrar Office',
  accountant: 'Finance & Treasury',
  principal: 'Principal Office',
  teacher: 'Faculty Portal',
  student: 'Student Portal',
  employee: 'Campus Operations',
};

const Sidebar = ({ mobileOpen = false, onClose, role: roleProp }) => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, plan, subStatus } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const activeRole = user?.role || roleProp || 'admin';
  const isSuperAdmin = activeRole === 'superAdmin';
  const rawLinks = NAV[activeRole] || [];

  const effectiveFeatures =
    user?.college?.effectiveFeatures || user?.college?.subscription?.features || null;

  // Filter links based on college effective features (unchanged business logic)
  const links = rawLinks.filter((link) => {
    if (isSuperAdmin) return true;
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

  const roleLabel = ROLE_LABELS[activeRole] || 'Portal';
  // Superadmin sidebar is always dark ink (#071A33), so always use dark horizontal logo
  const horizontalLogoSrc =
    isSuperAdmin || theme === 'dark'
      ? '/logo-horizontal-dark.svg'
      : '/logo-horizontal.svg';

  const homeHref = isSuperAdmin ? '/super-admin' : `/${activeRole}`;

  return (
    <aside
      aria-label="Sidebar navigation"
      data-sidebar-mode={isSuperAdmin ? 'platform-ink' : 'college'}
      className={`no-print fixed top-0 left-0 bottom-0 z-40 flex flex-col w-85 p-5 transition-transform duration-300 max-4xl:w-70 max-3xl:w-60 max-xl:w-74 max-md:p-3 border-r ${
        isSuperAdmin
          ? 'bg-[#071A33] text-[#F8FAFC] border-[#16325B]'
          : 'bg-b-surface1 text-t-primary border-s-subtle'
      } ${
        mobileOpen
          ? 'translate-x-0 shadow-dropdown'
          : 'max-xl:-translate-x-full xl:translate-x-0'
      }`}
    >
      {/* Top Plan / Command Center subtle accent glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-1"
        style={{
          background: isSuperAdmin
            ? 'linear-gradient(90deg, #0B4D94 0%, #4C94E8 50%, #3DBE63 100%)'
            : 'var(--header-strip)',
        }}
        aria-hidden="true"
      />

      {/* Brand Header + Plan/Tenant Context */}
      <div className="relative flex flex-col gap-3 pb-4 mb-2 border-b border-s-subtle/80">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={homeHref}
            onClick={onClose}
            className="inline-flex items-center focus-visible:outline-none"
          >
            <img
              src={horizontalLogoSrc}
              alt="CollegesHub"
              className="h-8 w-auto max-w-[185px] object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className={`xl:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors cursor-pointer ${
              isSuperAdmin
                ? 'bg-[#0D2546] text-[#93A4BF] hover:text-white'
                : 'bg-b-surface2 text-t-secondary hover:text-t-primary shadow-widget'
            }`}
          >
            <Icon name="close" className="!size-5 fill-current" />
          </button>
        </div>

        {/* Institution / Role Pill */}
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border ${
            isSuperAdmin
              ? 'bg-[#0D2546]/90 border-[#16325B]'
              : 'bg-b-surface2/90 border-s-subtle shadow-widget'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-caption font-semibold ${
                isSuperAdmin ? 'text-[#F8FAFC]' : 'text-t-primary'
              }`}
              title={user?.college?.name || 'CollegesHub Platform'}
            >
              {isSuperAdmin
                ? 'CollegesHub Cloud'
                : user?.college?.name || 'CollegesHub Institution'}
            </p>
            <p
              className={`truncate text-[11px] font-medium ${
                isSuperAdmin ? 'text-[#93A4BF]' : 'text-t-secondary'
              }`}
            >
              {roleLabel}
            </p>
          </div>
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#4C94E8]/15 text-[#4C94E8] border border-[#4C94E8]/30">
              HQ
            </span>
          ) : (
            <PlanBadge
              plan={plan || user?.college?.planId || 'starter'}
              status={
                subStatus === 'suspended' || subStatus === 'expired'
                  ? subStatus
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Scrollable Navigation List (Core 2.0 NavLink Geometry) */}
      <nav
        aria-label="Main navigation"
        className="flex flex-col gap-0.5 grow overflow-y-auto -mx-3 px-3 py-1 scrollbar-thin"
      >
        {links.map((link, idx) => {
          if (link.divider) {
            return (
              <div
                key={`div-${idx}`}
                className="mt-4 mb-1.5 px-3 flex items-center gap-2"
              >
                <span
                  className={`text-overline uppercase tracking-wider font-bold ${
                    isSuperAdmin ? 'text-[#93A4BF]/80' : 'text-t-tertiary'
                  }`}
                >
                  {link.label}
                </span>
                <span
                  className="h-px flex-1 rounded-full opacity-35"
                  style={{
                    background: isSuperAdmin
                      ? 'linear-gradient(90deg, #4C94E8, transparent)'
                      : 'linear-gradient(90deg, var(--accent, var(--primary-01)), transparent)',
                  }}
                  aria-hidden="true"
                />
              </div>
            );
          }

          const iconName = link.icon?.iconName || 'dashboard';

          if (link.comingSoon) {
            return (
              <div
                key={link.to}
                aria-disabled="true"
                className={`group relative flex items-center shrink-0 gap-3 h-11 px-3 rounded-xl text-button opacity-55 cursor-not-allowed ${
                  link.sub ? 'pl-9 h-10' : ''
                } ${isSuperAdmin ? 'text-[#93A4BF]' : 'text-t-tertiary'}`}
              >
                <Icon
                  name={iconName}
                  className={`!size-5 shrink-0 ${
                    isSuperAdmin ? 'fill-[#93A4BF]' : 'fill-t-tertiary'
                  }`}
                />
                <span className="truncate mr-2">{link.label}</span>
                <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] font-semibold bg-b-surface2 text-t-tertiary border border-s-subtle">
                  Soon
                </span>
              </div>
            );
          }

          const isActive = link.sub
            ? pathname === link.to
            : link.to.split('/').length <= 2
              ? pathname === link.to
              : pathname === link.to || pathname?.startsWith(`${link.to}/`);

          return (
            <Link
              key={link.to}
              href={link.to}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center shrink-0 gap-3 px-3 rounded-xl text-button transition-colors ${
                link.sub ? 'h-10 pl-9 text-body-2' : 'h-11'
              } ${
                isSuperAdmin
                  ? isActive
                    ? 'text-white font-semibold'
                    : 'text-[#93A4BF] hover:text-white hover:bg-[#0D2546]/60'
                  : isActive
                    ? 'text-t-primary font-semibold'
                    : 'text-t-secondary hover:text-t-primary'
              }`}
            >
              {/* Core 2.0 Active Pill Backdrop + Plan Accent Indicator */}
              {isActive && (
                isSuperAdmin ? (
                  <div className="absolute inset-0 rounded-xl bg-[#102A4C] border border-[#1E3F6F] shadow-depth-menu">
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full"
                      style={{
                        background: 'linear-gradient(180deg, #4C94E8 0%, #3DBE63 100%)',
                      }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 gradient-menu rounded-xl shadow-depth-menu">
                    <div className="absolute inset-0.25 bg-b-pop rounded-[0.6875rem]" />
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full z-2"
                      style={{
                        background: 'var(--accent, var(--primary-01))',
                      }}
                    />
                  </div>
                )
              )}

              {/* Sub-item branch connector */}
              {link.sub && (
                <span
                  className="absolute left-4 top-0 bottom-1/2 w-3 border-l border-b border-s-stroke2 rounded-bl-lg pointer-events-none"
                  aria-hidden="true"
                />
              )}

              <Icon
                name={iconName}
                className={`relative z-2 !size-5 shrink-0 transition-colors ${
                  isSuperAdmin
                    ? isActive
                      ? 'fill-[#4C94E8]'
                      : 'fill-[#93A4BF] group-hover:fill-white'
                    : isActive
                      ? 'fill-[var(--accent,var(--primary-01))]'
                      : 'fill-t-secondary group-hover:fill-t-primary'
                }`}
              />
              <span className="relative z-2 truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer: Core 2.0 Theme Switcher + Sign Out */}
      <div
        className={`mt-auto pt-4 border-t flex items-center justify-between gap-2 ${
          isSuperAdmin ? 'border-[#16325B]' : 'border-s-subtle'
        }`}
      >
        {/* Core 2.0 Theme Toggle Pill */}
        <div
          role="group"
          aria-label="Theme switcher"
          className={`inline-flex items-center gap-1 p-1 rounded-full border ${
            isSuperAdmin
              ? 'bg-[#0D2546] border-[#16325B]'
              : 'bg-b-surface2 border-s-subtle shadow-widget'
          }`}
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            aria-label="Switch to light mode"
            aria-pressed={theme === 'light'}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer ${
              theme === 'light'
                ? isSuperAdmin
                  ? 'bg-[#4C94E8] text-[#071A33] shadow-sm'
                  : 'bg-b-surface1 text-t-primary shadow-sm'
                : isSuperAdmin
                  ? 'text-[#93A4BF] hover:text-white'
                  : 'text-t-secondary hover:text-t-primary'
            }`}
          >
            <Icon name="sun" className="!size-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            aria-label="Switch to dark mode"
            aria-pressed={theme === 'dark'}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer ${
              theme === 'dark'
                ? isSuperAdmin
                  ? 'bg-[#16325B] text-white shadow-sm'
                  : 'bg-b-surface1 text-t-primary shadow-sm'
                : isSuperAdmin
                  ? 'text-[#93A4BF] hover:text-white'
                  : 'text-t-secondary hover:text-t-primary'
            }`}
          >
            <Icon name="moon" className="!size-4 fill-current" />
          </button>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          className={`flex items-center gap-2 h-10 px-3.5 rounded-full text-button transition-colors cursor-pointer ${
            isSuperAdmin
              ? 'text-[#93A4BF] hover:bg-red-500/15 hover:text-red-300'
              : 'text-t-secondary hover:bg-primary-03/10 hover:text-primary-03'
          }`}
        >
          <Icon name="logout" className="!size-4 fill-current" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
