'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../providers/ThemeProvider';
import { getAppPortalRoot } from '../../lib/portal';
import Icon from '../Icon';
import PlanBadge from '../common/PlanBadge';
import { NAV } from './navConfig';
import { useNavCounts } from '@/features/superAdminFinance/hooks/useFinance';

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

/**
 * Determine if a nav item route matches the current pathname.
 * Ensures child routes like `/admin/results/entry` don't also mark `/admin/results` active.
 */
const isRouteActive = (itemTo, pathname, allRoutes) => {
  if (!itemTo || !pathname) return false;
  const cleanPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const cleanItem = itemTo.length > 1 ? itemTo.replace(/\/+$/, '') : itemTo;
  if (cleanPath === cleanItem) return true;
  const depth = cleanItem.split('/').filter(Boolean).length;
  if (depth <= 1) return cleanPath === cleanItem;
  if (cleanPath.startsWith(`${cleanItem}/`)) {
    const hasMoreSpecificMatch = allRoutes.some(
      (other) => {
        if (!other) return false;
        const cleanOther = other.length > 1 ? other.replace(/\/+$/, '') : other;
        return cleanOther !== cleanItem &&
          cleanOther.length > cleanItem.length &&
          (cleanPath === cleanOther || cleanPath.startsWith(`${cleanOther}/`));
      }
    );
    return !hasMoreSpecificMatch;
  }
  return false;
};

const Sidebar = ({
  mobileOpen = false,
  onClose,
  role: roleProp,
  compact = false,
}) => {
  const { user } = useAuthStore();
  const { theme, plan, subStatus } = useTheme();
  const rawPathname = usePathname();
  const pathname = rawPathname && rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : (rawPathname || '');
  const navRef = useRef(null);

  const activeRole = user?.role || roleProp || 'admin';
  const isSuperAdmin = activeRole === 'superAdmin';
  const isCompactDesktop = Boolean(compact && !mobileOpen);

  const { data: navCounts } = useNavCounts(false, { enabled: isSuperAdmin });

  const effectiveFeatures =
    user?.college?.effectiveFeatures || user?.college?.subscription?.features || null;

  // Filter links and categories based on college effectiveFeatures (unchanged business logic)
  const navItems = useMemo(() => {
    const rawItems = NAV[activeRole] || [];
    const isAllowed = (item) => {
      if (isSuperAdmin) return true;
      if (!item.feature) return true;
      if (!effectiveFeatures) return true;
      return effectiveFeatures.includes(item.feature);
    };

    return rawItems
      .map((item) => {
        if (Array.isArray(item.children)) {
          const visibleChildren = item.children.filter(isAllowed);
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }
        return isAllowed(item) ? item : null;
      })
      .filter(Boolean);
  }, [activeRole, isSuperAdmin, effectiveFeatures]);

  // Flat list of all visible route strings for exact vs prefix disambiguation
  const allVisibleRoutes = useMemo(() => {
    const routes = [];
    navItems.forEach((item) => {
      if (item.to) routes.push(item.to);
      if (Array.isArray(item.children)) {
        item.children.forEach((c) => {
          if (c.to) routes.push(c.to);
        });
      }
    });
    return routes;
  }, [navItems]);

  // Identify which category contains the active route
  const activeCategoryId = useMemo(() => {
    for (const item of navItems) {
      if (Array.isArray(item.children)) {
        const hasActiveChild = item.children.some(
          (child) =>
            !child.comingSoon && isRouteActive(child.to, pathname, allVisibleRoutes)
        );
        if (hasActiveChild) return item.id;
      }
    }
    return null;
  }, [navItems, pathname, allVisibleRoutes]);

  const storageKey = `cesms-sidebar-expanded:${user?._id || activeRole}`;
  const [expandedMap, setExpandedMap] = useState({});
  const [hydratedStorage, setHydratedStorage] = useState(false);

  // Load persisted expanded state from localStorage (wrapped in try/catch)
  useEffect(() => {
    let saved = {};
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          saved = parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }

    if (activeCategoryId) {
      saved = { ...saved, [activeCategoryId]: true };
    } else if (Object.keys(saved).length === 0) {
      const firstCategory = navItems.find((item) => Array.isArray(item.children));
      if (firstCategory) {
        saved = { [firstCategory.id]: true };
      }
    }

    setExpandedMap(saved);
    setHydratedStorage(true);
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand the category containing the active route on navigation
  useEffect(() => {
    if (!activeCategoryId) return;
    setExpandedMap((prev) => {
      if (prev[activeCategoryId]) return prev;
      const next = { ...prev, [activeCategoryId]: true };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, [activeCategoryId, storageKey]);

  const toggleCategory = useCallback(
    (categoryId) => {
      setExpandedMap((prev) => {
        const next = { ...prev, [categoryId]: !prev[categoryId] };
        if (hydratedStorage) {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            // Ignore storage errors
          }
        }
        return next;
      });
    },
    [hydratedStorage, storageKey]
  );

  // Compact sidebar flyout & tooltip state (hover or click on collapsed 48px icons)
  const [flyoutCategory, setFlyoutCategory] = useState(null);
  const [flyoutAnchorRect, setFlyoutAnchorRect] = useState(null);
  const [compactTooltip, setCompactTooltip] = useState(null);
  const closeFlyoutTimerRef = useRef(null);

  const clearFlyoutTimer = () => {
    if (closeFlyoutTimerRef.current) {
      clearTimeout(closeFlyoutTimerRef.current);
      closeFlyoutTimerRef.current = null;
    }
  };

  const openFlyout = (item, targetEl) => {
    clearFlyoutTimer();
    setCompactTooltip(null);
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    setFlyoutCategory(item);
    setFlyoutAnchorRect({
      top: Math.max(16, Math.min(rect.top, window.innerHeight - 320)),
      left: rect.right + 12,
    });
  };

  const scheduleCloseFlyout = () => {
    clearFlyoutTimer();
    closeFlyoutTimerRef.current = setTimeout(() => {
      setFlyoutCategory(null);
    }, 150);
  };

  const showIconTooltip = (label, targetEl) => {
    if (!isCompactDesktop || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    setCompactTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const hideIconTooltip = () => {
    setCompactTooltip(null);
  };

  useEffect(() => {
    setFlyoutCategory(null);
    setCompactTooltip(null);
  }, [pathname, isCompactDesktop]);

  useEffect(() => {
    if (!flyoutCategory) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setFlyoutCategory(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flyoutCategory]);

  // Arrow-key navigation across visible focusable items in the sidebar
  const focusAdjacentNavItem = (currentEl, direction) => {
    if (!navRef.current) return;
    const allFocusable = Array.from(
      navRef.current.querySelectorAll('[data-sidebar-nav-item="true"]')
    ).filter((el) => {
      const collapsedParent = el.closest('[data-collapsed="true"]');
      return !collapsedParent;
    });
    const currentIndex = allFocusable.indexOf(currentEl);
    if (currentIndex === -1) return;
    const nextIndex =
      direction === 'down'
        ? (currentIndex + 1) % allFocusable.length
        : (currentIndex - 1 + allFocusable.length) % allFocusable.length;
    allFocusable[nextIndex]?.focus();
  };

  const roleLabel = ROLE_LABELS[activeRole] || 'Portal';
  const horizontalLogoSrc =
    theme === 'dark' ? '/logo-horizontal-dark.svg' : '/logo-horizontal.svg';
  const homeHref = isSuperAdmin ? '/super-admin' : `/${activeRole}`;

  const portalRoot = typeof document !== 'undefined' ? getAppPortalRoot() : null;

  return (
    <aside
      aria-label="Sidebar navigation"
      data-sidebar-mode={isSuperAdmin ? 'platform' : 'college'}
      data-sidebar-compact={isCompactDesktop ? 'true' : 'false'}
      className={`no-print fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-b-surface1 text-t-primary transition-[width,transform,background-color] duration-250 ease-out motion-reduce:transition-none ${
        isCompactDesktop
          ? 'xl:w-22 xl:px-3 xl:py-5 max-xl:w-76 max-xl:p-5 max-md:p-3'
          : 'w-85 p-5 max-4xl:w-70 max-3xl:w-60 max-xl:w-76 max-md:p-3'
      } ${
        mobileOpen
          ? 'translate-x-0 shadow-dropdown'
          : 'max-xl:-translate-x-full xl:translate-x-0'
      }`}
    >
      {/* Brand Header + Institution / Plan Context (No border lines — separated by spacing & contrast) */}
      <div
        className={`relative flex flex-col gap-3 mb-5 ${
          isCompactDesktop ? 'xl:items-center' : ''
        }`}
      >
        <div
          className={`flex items-center gap-2 ${
            isCompactDesktop ? 'xl:justify-center' : 'justify-between'
          }`}
        >
          <Link
            href={homeHref}
            onClick={onClose}
            aria-label="CollegesHub Home"
            onMouseEnter={(e) =>
              isCompactDesktop && showIconTooltip('CollegesHub Home', e.currentTarget)
            }
            onMouseLeave={hideIconTooltip}
            onFocus={(e) =>
              isCompactDesktop && showIconTooltip('CollegesHub Home', e.currentTarget)
            }
            onBlur={hideIconTooltip}
            className={`inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,var(--primary-01))] rounded-2xl ${
              isCompactDesktop ? 'xl:w-12 xl:h-12' : ''
            }`}
          >
            {isCompactDesktop ? (
              <img
                src="/logo-mark.svg"
                alt="CollegesHub"
                className="h-9 w-9 object-contain"
              />
            ) : (
              <img
                src={horizontalLogoSrc}
                alt="CollegesHub"
                className="h-8 w-auto max-w-[185px] object-contain"
              />
            )}
          </Link>

          {/* Mobile Drawer Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="xl:hidden flex items-center justify-center w-12 h-12 rounded-full bg-b-surface2 text-t-secondary hover:text-t-primary shadow-widget transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,var(--primary-01))]"
          >
            <Icon name="close" className="!size-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Scrollable Navigation List (Sample Core 2.0 NavLink + Expandable Dropdown Geometry) */}
      <nav
        ref={navRef}
        aria-label="Main navigation"
        className={`flex flex-col grow overflow-y-auto py-1 scrollbar-thin ${
          isCompactDesktop
            ? 'xl:items-center xl:gap-2 xl:mx-0 xl:px-0'
            : 'gap-1 -mx-3 px-3'
        }`}
      >
        {navItems.map((item) => {
          const iconName = item.icon?.iconName || 'dashboard';

          /* ── 1. Top-Level Single Item (e.g., Dashboard) ── */
          if (!Array.isArray(item.children)) {
            const isActive = isRouteActive(item.to, pathname, allVisibleRoutes);

            return (
              <Link
                key={item.id || item.to}
                href={item.to}
                onClick={onClose}
                data-sidebar-nav-item="true"
                aria-current={isActive ? 'page' : undefined}
                aria-label={isCompactDesktop ? item.label : undefined}
                title={isCompactDesktop ? item.label : undefined}
                onMouseEnter={(e) =>
                  isCompactDesktop && showIconTooltip(item.label, e.currentTarget)
                }
                onMouseLeave={hideIconTooltip}
                onFocus={(e) =>
                  isCompactDesktop && showIconTooltip(item.label, e.currentTarget)
                }
                onBlur={hideIconTooltip}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    focusAdjacentNavItem(e.currentTarget, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    focusAdjacentNavItem(e.currentTarget, 'up');
                  }
                }}
                className={`group relative flex items-center shrink-0 gap-3 rounded-xl text-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,var(--primary-01))] ${
                  isCompactDesktop
                    ? 'xl:w-12 xl:h-12 xl:justify-center xl:px-0 px-3 h-12'
                    : 'h-12 px-3'
                } ${
                  isActive
                    ? 'text-t-primary font-semibold'
                    : 'text-t-secondary hover:text-t-primary'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 gradient-menu rounded-xl shadow-depth-menu">
                    <div className="absolute inset-0.25 bg-b-pop rounded-[0.6875rem]" />
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full z-2"
                      style={{
                        background: 'var(--accent, var(--primary-01))',
                      }}
                    />
                  </div>
                )}

                <Icon
                  name={item.icon || iconName}
                  active={isActive}
                  className={`relative z-2 !size-5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-[var(--accent,var(--primary-01))] fill-[var(--accent,var(--primary-01))]'
                      : 'text-t-secondary group-hover:text-t-primary'
                  }`}
                />
                {!isCompactDesktop && (
                  <span className="relative z-2 truncate">{item.label}</span>
                )}
              </Link>
            );
          }

          /* ── 2. Expandable Category Dropdown (Sample Sidebar/Dropdown 1:1) ── */
          const isCategoryActive = activeCategoryId === item.id;
          const isOpen = Boolean(expandedMap[item.id]);
          const groupPanelId = `sidebar-group-${item.id}`;
          const groupButtonId = `sidebar-trigger-${item.id}`;

          // Compact Desktop Mode: 48px Centered Category Icon Pill with Tooltip + Flyout Popover
          if (isCompactDesktop) {
            const isFlyoutOpen = flyoutCategory?.id === item.id;
            return (
              <div
                key={item.id}
                className="relative flex items-center justify-center"
                onMouseEnter={(e) => openFlyout(item, e.currentTarget)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <button
                  id={groupButtonId}
                  type="button"
                  data-sidebar-nav-item="true"
                  aria-label={item.label}
                  aria-expanded={isFlyoutOpen}
                  aria-haspopup="true"
                  title={item.label}
                  onFocus={(e) => showIconTooltip(item.label, e.currentTarget)}
                  onBlur={hideIconTooltip}
                  onClick={(e) => {
                    if (isFlyoutOpen) {
                      setFlyoutCategory(null);
                    } else {
                      openFlyout(item, e.currentTarget);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      focusAdjacentNavItem(e.currentTarget, 'down');
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      focusAdjacentNavItem(e.currentTarget, 'up');
                    } else if (
                      e.key === 'ArrowRight' ||
                      e.key === 'Enter' ||
                      e.key === ' '
                    ) {
                      e.preventDefault();
                      openFlyout(item, e.currentTarget);
                    }
                  }}
                  className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,var(--primary-01))] ${
                    isCategoryActive || isFlyoutOpen
                      ? 'text-t-primary'
                      : 'text-t-secondary hover:text-t-primary'
                  }`}
                >
                  {(isCategoryActive || isFlyoutOpen) && (
                    <div className="absolute inset-0 gradient-menu rounded-xl shadow-depth-menu">
                      <div className="absolute inset-0.25 bg-b-pop rounded-[0.6875rem]" />
                      {isCategoryActive && (
                        <span
                          className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full z-2"
                          style={{
                            background: 'var(--accent, var(--primary-01))',
                          }}
                        />
                      )}
                    </div>
                  )}
                  <Icon
                    name={item.icon || iconName}
                    active={isCategoryActive || isFlyoutOpen}
                    className={`relative z-2 !size-5 shrink-0 transition-colors ${
                      isCategoryActive || isFlyoutOpen
                        ? 'text-[var(--accent,var(--primary-01))] fill-[var(--accent,var(--primary-01))]'
                        : 'text-t-secondary group-hover:text-t-primary'
                    }`}
                  />
                </button>
              </div>
            );
          }

          // Standard Expanded Sidebar & Mobile Drawer Mode
          return (
            <div key={item.id} className="relative flex flex-col">
              <button
                id={groupButtonId}
                type="button"
                data-sidebar-nav-item="true"
                aria-expanded={isOpen}
                aria-controls={groupPanelId}
                onClick={() => toggleCategory(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    focusAdjacentNavItem(e.currentTarget, 'down');
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    focusAdjacentNavItem(e.currentTarget, 'up');
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (!isOpen) {
                      toggleCategory(item.id);
                    } else {
                      focusAdjacentNavItem(e.currentTarget, 'down');
                    }
                  } else if (e.key === 'ArrowLeft' && isOpen) {
                    e.preventDefault();
                    toggleCategory(item.id);
                  }
                }}
                className={`group relative flex items-center gap-3 w-full h-12 px-3 rounded-xl text-button transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,var(--primary-01))] ${
                  isCategoryActive
                    ? 'text-t-primary font-semibold'
                    : isOpen
                      ? 'text-t-primary font-medium'
                      : 'text-t-secondary hover:text-t-primary'
                }`}
              >
                {isCategoryActive && !isOpen && (
                  <div className="absolute inset-0 gradient-menu rounded-xl shadow-depth-menu">
                    <div className="absolute inset-0.25 bg-b-pop rounded-[0.6875rem]" />
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full z-2"
                      style={{
                        background: 'var(--accent, var(--primary-01))',
                      }}
                    />
                  </div>
                )}

                <Icon
                  name={item.icon || iconName}
                  active={isCategoryActive}
                  className={`relative z-2 !size-5 shrink-0 transition-colors ${
                    isCategoryActive
                      ? 'text-[var(--accent,var(--primary-01))] fill-[var(--accent,var(--primary-01))]'
                      : isOpen
                        ? 'text-t-primary'
                        : 'text-t-secondary group-hover:text-t-primary'
                  }`}
                />
                <span className="relative z-2 truncate text-left">
                  {item.label}
                </span>
                <Icon
                  name="chevron"
                  className={`relative z-2 ml-auto !size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    isOpen
                      ? 'rotate-180 fill-t-primary'
                      : 'fill-t-secondary group-hover:fill-t-primary'
                  }`}
                />
              </button>

              {/* Smooth Height + Opacity Expand/Collapse Container */}
              <div
                id={groupPanelId}
                role="region"
                aria-labelledby={groupButtonId}
                data-collapsed={!isOpen ? 'true' : 'false'}
                className={`grid transition-[grid-template-rows,opacity] duration-[220ms] ease-out motion-reduce:transition-none ${
                  isOpen
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  {/* Sample 1:1 Vertical Tree Line + Curved L-Connectors */}
                  <div className="relative flex flex-col pl-9 pt-0.5 pb-1 before:pointer-events-none before:absolute before:top-0 before:left-[1.4375rem] before:bottom-11 before:w-[1.5px] before:bg-s-stroke2">
                    {item.children.map((child, childIdx) => {
                      const isChildActive =
                        !child.comingSoon &&
                        isRouteActive(child.to, pathname, allVisibleRoutes);

                      return (
                        <div
                          key={child.to}
                          style={{
                            transitionDelay: isOpen
                              ? `${Math.min(childIdx * 18, 110)}ms`
                              : '0ms',
                          }}
                          className={`relative transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
                            isOpen
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-0 -translate-y-1'
                          }`}
                        >
                          {/* Sample Curved L-Connector */}
                          <div
                            className="pointer-events-none absolute top-0 -left-[0.8125rem] bottom-[calc(50%-0.75px)] w-[0.8125rem] border-l border-b border-s-stroke2 rounded-bl-[10px]"
                            aria-hidden="true"
                          />

                          {child.comingSoon ? (
                            <div
                              aria-disabled="true"
                              className="group relative flex items-center shrink-0 gap-2.5 h-11 px-3 rounded-xl text-button text-t-tertiary opacity-60 cursor-not-allowed"
                            >
                              <span className="truncate mr-2">{child.label}</span>
                              <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] font-semibold bg-b-surface2 text-t-tertiary">
                                Soon
                              </span>
                            </div>
                          ) : (
                            <Link
                              href={child.to}
                              onClick={onClose}
                              tabIndex={isOpen ? 0 : -1}
                              data-sidebar-nav-item="true"
                              aria-current={isChildActive ? 'page' : undefined}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  focusAdjacentNavItem(e.currentTarget, 'down');
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  focusAdjacentNavItem(e.currentTarget, 'up');
                                } else if (e.key === 'ArrowLeft') {
                                  e.preventDefault();
                                  const parentBtn =
                                    document.getElementById(groupButtonId);
                                  parentBtn?.focus();
                                }
                              }}
                              className={`group relative flex items-center shrink-0 gap-2.5 h-11 px-3 rounded-xl text-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,var(--primary-01))] ${
                                isChildActive
                                  ? 'text-t-primary font-semibold'
                                  : 'text-t-secondary hover:text-t-primary'
                              }`}
                            >
                              {isChildActive && (
                                <div className="absolute inset-0 gradient-menu rounded-xl shadow-depth-menu">
                                  <div className="absolute inset-0.25 bg-b-pop rounded-[0.6875rem]" />
                                  <span
                                    className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full z-2"
                                    style={{
                                      background:
                                        'var(--accent, var(--primary-01))',
                                    }}
                                  />
                                </div>
                              )}
                              <span className="relative z-2 truncate mr-auto">
                                {child.label}
                              </span>
                              {child.badgeKey && navCounts?.[child.badgeKey] != null && (
                                <span className="relative z-2 ml-auto px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-b-surface2 text-t-secondary tabular-nums">
                                  {navCounts[child.badgeKey]}
                                </span>
                              )}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Compact Sidebar Icon Tooltip (Portaled inside #app-portal-root) */}
      {isCompactDesktop &&
        compactTooltip &&
        !flyoutCategory &&
        portalRoot &&
        createPortal(
          <div
            role="tooltip"
            style={{
              top: `${compactTooltip.top}px`,
              left: `${compactTooltip.left}px`,
              transform: 'translateY(-50%)',
            }}
            className="no-print pointer-events-none fixed z-[109] px-3 py-1.5 rounded-xl bg-b-surface2 text-caption font-semibold text-t-primary shadow-dropdown border border-s-subtle whitespace-nowrap"
          >
            {compactTooltip.label}
          </div>,
          portalRoot
        )}

      {/* Compact Sidebar Flyout Popover (Portaled inside #app-portal-root so it inherits theme & plan tokens) */}
      {isCompactDesktop &&
        flyoutCategory &&
        flyoutAnchorRect &&
        portalRoot &&
        createPortal(
          <div
            role="menu"
            aria-label={`${flyoutCategory.label} navigation`}
            onMouseEnter={clearFlyoutTimer}
            onMouseLeave={scheduleCloseFlyout}
            style={{
              top: `${flyoutAnchorRect.top}px`,
              left: `${flyoutAnchorRect.left}px`,
            }}
            className="no-print fixed z-[108] w-68 p-3 rounded-3xl bg-b-surface2 border border-s-subtle shadow-dropdown animate-fade-in"
          >
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <Icon
                name={flyoutCategory.icon || flyoutCategory.icon?.iconName || 'dashboard'}
                active={true}
                className="!size-4 shrink-0 text-[var(--accent,var(--primary-01))] fill-[var(--accent,var(--primary-01))]"
              />
              <span className="text-sub-title-2 font-semibold text-t-primary">
                {flyoutCategory.label}
              </span>
            </div>

            <div className="relative flex flex-col pl-7 pt-0.5 before:pointer-events-none before:absolute before:top-0 before:left-[0.9375rem] before:bottom-10 before:w-[1.5px] before:bg-s-stroke2">
              {flyoutCategory.children.map((child) => {
                const isChildActive =
                  !child.comingSoon &&
                  isRouteActive(child.to, pathname, allVisibleRoutes);

                return (
                  <div key={child.to} className="relative">
                    <div
                      className="pointer-events-none absolute top-0 -left-[0.8125rem] bottom-[calc(50%-0.75px)] w-[0.8125rem] border-l border-b border-s-stroke2 rounded-bl-[10px]"
                      aria-hidden="true"
                    />
                    {child.comingSoon ? (
                      <div
                        aria-disabled="true"
                        className="flex items-center justify-between h-10 px-3 rounded-xl text-button text-t-tertiary opacity-60 cursor-not-allowed"
                      >
                        <span className="truncate">{child.label}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-b-surface1 text-t-tertiary">
                          Soon
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={child.to}
                        role="menuitem"
                        onClick={() => {
                          setFlyoutCategory(null);
                          if (onClose) onClose();
                        }}
                        aria-current={isChildActive ? 'page' : undefined}
                        className={`group relative flex items-center h-10 px-3 rounded-xl text-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,var(--primary-01))] ${
                          isChildActive
                            ? 'text-t-primary font-semibold'
                            : 'text-t-secondary hover:text-t-primary'
                        }`}
                      >
                        {isChildActive && (
                          <div className="absolute inset-0 gradient-menu rounded-xl shadow-depth-menu">
                            <div className="absolute inset-0.25 bg-b-pop rounded-[0.6875rem]" />
                            <span
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full z-2"
                              style={{
                                background: 'var(--accent, var(--primary-01))',
                              }}
                            />
                          </div>
                        )}
                        <span className="relative z-2 truncate mr-auto">
                          {child.label}
                        </span>
                        {child.badgeKey && navCounts?.[child.badgeKey] != null && (
                          <span className="relative z-2 ml-auto px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-b-surface2 text-t-secondary tabular-nums">
                            {navCounts[child.badgeKey]}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          portalRoot
        )}
    </aside>
  );
};

export default memo(Sidebar);
