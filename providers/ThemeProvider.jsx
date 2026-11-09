'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { resolveCollegePlan, resolveSubscriptionState } from '../lib/planTheme';
import api from '../lib/api';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  plan: null,
  subStatus: 'active',
  appType: 'college',
});

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('ui-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore storage errors
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const syncHtmlTheme = (theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
};

export function ThemeProvider({ children }) {
  // Always initialize to 'light' so SSR HTML and client hydration match 100%,
  // then immediately sync from localStorage / media query in useEffect so React
  // is guaranteed to reconcile data-theme on all [data-app] wrappers.
  const [theme, setThemeState] = useState('light');
  const [themeMounted, setThemeMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    syncHtmlTheme(initial);
    setThemeMounted(true);
  }, []);

  // Observe #app-portal-root so <Toaster /> portals directly inside [data-app]'s #app-portal-root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncPortal = () => {
      const root = document.getElementById('app-portal-root');
      setPortalTarget((prev) => (prev !== root ? root : prev));
    };
    syncPortal();
    const observer = new MutationObserver(syncPortal);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((prev) => {
      const resolved = typeof nextTheme === 'function' ? nextTheme(prev) : nextTheme;
      const valid = resolved === 'dark' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ui-theme', valid);
        } catch {
          // ignore storage errors
        }
      }
      syncHtmlTheme(valid);
      return valid;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  // Live subscription / plan reactivity on window focus + 5-minute interval
  const refreshSubscription = useCallback(async (force = false) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || currentUser.role === 'superAdmin' || !currentUser.college) return;

    const now = Date.now();
    if (!force && now - lastFetchRef.current < 30_000) return;
    lastFetchRef.current = now;

    try {
      const { data } = await api.get('/subscription/current');
      const payload = data?.data || data;
      if (!payload || typeof payload !== 'object') return;

      const prevCollege = currentUser.college || {};
      const nextPlanId = payload.planId || prevCollege.planId || prevCollege.subscription?.planId;
      const nextSubStatus = payload.subStatus || payload.status || prevCollege.subStatus || prevCollege.subscription_status;

      const changed =
        nextPlanId !== prevCollege.planId ||
        nextSubStatus !== prevCollege.subStatus ||
        payload.isReadOnly !== prevCollege.isReadOnly;

      if (changed) {
        updateUser({
          college: {
            ...prevCollege,
            planId: nextPlanId,
            subStatus: nextSubStatus,
            subscription_status: nextSubStatus,
            periodEnd: payload.periodEnd ?? prevCollege.periodEnd,
            trialEndsAt: payload.trialEndsAt ?? prevCollege.trialEndsAt,
            isReadOnly: payload.isReadOnly ?? prevCollege.isReadOnly,
            forceReadOnly: payload.isReadOnly ?? prevCollege.forceReadOnly,
            readOnlyReason: payload.readOnlyReason ?? prevCollege.readOnlyReason,
            subscription: {
              ...(prevCollege.subscription || {}),
              planId: nextPlanId,
              status: nextSubStatus,
              periodEnd: payload.periodEnd ?? prevCollege.subscription?.periodEnd,
              trialEndsAt: payload.trialEndsAt ?? prevCollege.subscription?.trialEndsAt,
            },
          },
        });
      }
    } catch {
      // Silently ignore network/offline errors during background poll
    }
  }, [updateUser]);

  useEffect(() => {
    if (!user || user.role === 'superAdmin' || !user.college) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshSubscription(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    const intervalId = setInterval(() => refreshSubscription(false), 300_000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(intervalId);
    };
  }, [user?.role, user?.college?._id, refreshSubscription]);

  const plan = resolveCollegePlan(user);
  const subStatus = resolveSubscriptionState(user);
  const appType = user?.role === 'superAdmin' ? 'platform' : 'college';

  const toasterNode = (
    <Toaster
      position="top-right"
      containerClassName="!z-[120]"
      toastOptions={{
        className: 'app-toast-item',
        style: {
          background: 'var(--backgrounds-surface2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--stroke-stroke2)',
          borderLeft: '4px solid var(--accent, var(--primary-01))',
          borderRadius: '1rem',
          fontSize: '0.84375rem',
          fontWeight: 500,
          boxShadow: 'var(--box-shadow-dropdown)',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: 'var(--primary-02)',
            secondary: 'var(--backgrounds-surface2)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--primary-03)',
            secondary: 'var(--backgrounds-surface2)',
          },
        },
      }}
    />
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMounted,
        setTheme,
        toggleTheme,
        plan,
        subStatus,
        appType,
        refreshSubscription,
      }}
    >
      {children}
      {/* Portal <Toaster /> directly inside #app-portal-root (inside [data-app]) when mounted */}
      {portalTarget ? (
        createPortal(toasterNode, portalTarget)
      ) : (
        <div
          data-app={appType}
          data-theme={themeMounted ? theme : undefined}
          data-plan={plan || undefined}
          data-sub-status={subStatus}
          className="no-print"
        >
          {toasterNode}
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;

