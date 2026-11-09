'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import Icon from '@/components/Icon';

import PlanFilterDropdown from '@/components/superAdmin/colleges/PlanFilterDropdown';
import CollegesStatsCards from '@/components/superAdmin/colleges/CollegesStatsCards';
import CollegesTable from '@/components/superAdmin/colleges/CollegesTable';
import InvitationsTable from '@/components/superAdmin/colleges/InvitationsTable';
import InviteCollegeDrawer from '@/components/superAdmin/colleges/InviteCollegeDrawer';

const ACTUAL_PLANS = [
  { id: 'starter', name: 'Starter' },
  { id: 'standard', name: 'Standard' },
  { id: 'premium', name: 'Premium' },
  { id: 'enterprise', name: 'Enterprise' },
];

const Colleges = () => {
  const navigate = useNavigate();

  // Data State
  const [colleges, setColleges] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selected Card State (Default: null — no card selected)
  // Cards act as tabs & filters: 'active' | 'suspended' | 'invitations' | 'expired' | null
  const [selectedCard, setSelectedCard] = useState(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchInvitations = async () => {
    try {
      const { data } = await api.get('/super-admin/invitations');
      setInvitations(data.data || []);
    } catch {
      // Silent fallback
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          api.get('/super-admin/colleges'),
          api.get('/super-admin/invitations'),
        ]);
        if (isMounted) {
          setColleges(cRes.data?.data || []);
          setInvitations(iRes.data?.data || []);
        }
      } catch {
        if (isMounted) toast.error('Failed to load colleges');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResendInvite = async (id) => {
    try {
      await api.post(`/super-admin/invitations/${id}/resend`);
      toast.success('Invitation resent with fresh 48h token!');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvite = async (id) => {
    try {
      await api.delete(`/super-admin/invitations/${id}`);
      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  /* ── 4 Core Counts ── */
  const activeCollegesCount = useMemo(() => {
    return colleges.filter((c) => {
      const st = (
        c.subscription?.status ||
        c.subscription_status ||
        c.status ||
        'active'
      ).toLowerCase();
      return (
        c.isActive !== false &&
        st !== 'suspended' &&
        st !== 'expired' &&
        st !== 'grace'
      );
    }).length;
  }, [colleges]);

  const suspendedCollegesCount = useMemo(() => {
    return colleges.filter((c) => {
      const st = (
        c.subscription?.status ||
        c.subscription_status ||
        c.status ||
        ''
      ).toLowerCase();
      return c.isActive === false || st === 'suspended';
    }).length;
  }, [colleges]);

  const pendingInvitesCount = useMemo(() => {
    return invitations.filter((i) => i.status === 'pending').length;
  }, [invitations]);

  const expiredGraceCount = useMemo(() => {
    return colleges.filter((c) => {
      const st = (
        c.subscription?.status ||
        c.subscription_status ||
        c.status ||
        ''
      ).toLowerCase();
      return (
        st === 'expired' ||
        st === 'grace' ||
        (c.daysLeft !== null && c.daysLeft <= 0)
      );
    }).length;
  }, [colleges]);

  /* ── 12-Month Telemetry Time-Series ── */
  const collegeTimeSeries = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999
      );
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label,
        endOfMonth,
      });
    }

    return buckets.map((b, idx) => {
      let active = 0;
      let suspended = 0;
      let expired = 0;
      let total = 0;

      colleges.forEach((c) => {
        const created = c.createdAt ? new Date(c.createdAt) : null;
        if (!created || created <= b.endOfMonth) {
          total += 1;
          const status = (
            c.subscription?.status ||
            c.subscription_status ||
            (c.isActive === false ? 'suspended' : 'active')
          ).toLowerCase();
          if (status === 'suspended' || c.isActive === false) {
            suspended += 1;
          } else if (status === 'expired' || status === 'grace') {
            expired += 1;
          } else {
            active += 1;
          }
        }
      });

      let invCount = 0;
      invitations.forEach((inv) => {
        const created = inv.createdAt ? new Date(inv.createdAt) : null;
        if (!created || created <= b.endOfMonth) {
          invCount += 1;
        }
      });

      return {
        label: b.label,
        total,
        active: idx === buckets.length - 1 ? activeCollegesCount : active,
        suspended:
          idx === buckets.length - 1 ? suspendedCollegesCount : suspended,
        expired: idx === buckets.length - 1 ? expiredGraceCount : expired,
        invitations:
          idx === buckets.length - 1 ? pendingInvitesCount : invCount,
      };
    });
  }, [
    colleges,
    invitations,
    activeCollegesCount,
    suspendedCollegesCount,
    expiredGraceCount,
    pendingInvitesCount,
  ]);

  const prevPoint =
    collegeTimeSeries.length >= 2
      ? collegeTimeSeries[collegeTimeSeries.length - 2]
      : collegeTimeSeries[0] || {};

  const computeDelta = (curr, prev) => {
    if (!prev || prev <= 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const activeDelta = computeDelta(activeCollegesCount, prevPoint.active);
  const suspendedDelta = computeDelta(
    suspendedCollegesCount,
    prevPoint.suspended
  );
  const invitesDelta = computeDelta(pendingInvitesCount, prevPoint.invitations);
  const expiredDelta = computeDelta(expiredGraceCount, prevPoint.expired);

  const statsCards = [
    {
      id: 'active',
      label: 'Active Colleges',
      value: activeCollegesCount.toLocaleString(),
      caption: 'healthy workspaces',
      delta: activeDelta,
      isUpgrade: activeDelta >= 0,
      sparkline: collegeTimeSeries.slice(-8).map((p) => ({ val: p.active })),
    },
    {
      id: 'suspended',
      label: 'Suspended Colleges',
      value: suspendedCollegesCount.toLocaleString(),
      caption:
        suspendedCollegesCount === 0
          ? 'zero suspended'
          : 'requires review',
      delta: suspendedDelta,
      isUpgrade: suspendedCollegesCount === 0 || suspendedDelta < 0,
      sparkline: collegeTimeSeries.slice(-8).map((p) => ({ val: p.suspended })),
    },
    {
      id: 'invitations',
      label: 'Invitations',
      value: pendingInvitesCount.toLocaleString(),
      caption: `${pendingInvitesCount} pending onboarding`,
      delta: invitesDelta,
      isUpgrade: true,
      sparkline: collegeTimeSeries.slice(-8).map((p) => ({ val: p.invitations })),
    },
    {
      id: 'expired',
      label: 'Expired / Grace',
      value: expiredGraceCount.toLocaleString(),
      caption:
        expiredGraceCount === 0 ? 'all in good standing' : 'renewal due',
      delta: expiredDelta,
      isUpgrade: expiredGraceCount === 0 || expiredDelta < 0,
      sparkline: collegeTimeSeries.slice(-8).map((p) => ({ val: p.expired })),
    },
  ];

  const handleCardClick = (cardId) => {
    setSelectedCard((prev) => (prev === cardId ? null : cardId));
  };

  /* ── Filtered Colleges List ── */
  const filteredColleges = useMemo(() => {
    return colleges.filter((c) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.name?.toLowerCase().includes(query) ||
        c.code?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.city?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.contactPhone?.toLowerCase().includes(query) ||
        c.adminPhone?.toLowerCase().includes(query) ||
        c.mobile?.toLowerCase().includes(query);

      const matchesPlan =
        !planFilter ||
        c.subscription?.plan === planFilter ||
        c.planId === planFilter;

      let matchesExpiry = true;
      if (expiringSoonOnly) {
        matchesExpiry =
          c.daysLeft !== null && c.daysLeft <= 30 && c.daysLeft > 0;
      }

      let matchesCard = true;
      const status = (
        c.subscription?.status ||
        c.subscription_status ||
        c.status ||
        (c.isActive === false ? 'suspended' : 'active')
      ).toLowerCase();

      if (selectedCard === 'active') {
        matchesCard =
          c.isActive !== false &&
          status !== 'suspended' &&
          status !== 'expired' &&
          status !== 'grace';
      } else if (selectedCard === 'suspended') {
        matchesCard = status === 'suspended' || c.isActive === false;
      } else if (selectedCard === 'expired') {
        matchesCard =
          status === 'expired' ||
          status === 'grace' ||
          (c.daysLeft !== null && c.daysLeft <= 0);
      }

      return matchesSearch && matchesPlan && matchesExpiry && matchesCard;
    });
  }, [colleges, search, planFilter, expiringSoonOnly, selectedCard]);

  /* ── Filtered Invitations List ── */
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const query = search.toLowerCase().trim();
      const matchesSearch = !query || inv.email?.toLowerCase().includes(query);
      const matchesPlan = !planFilter || inv.planId === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [invitations, search, planFilter]);

  const isDefaultView = selectedCard === null;
  const isInvitationsMode = selectedCard === 'invitations';

  const getSeriesConfig = (seriesKey) => {
    const baseColors = {
      active: 'var(--chart-2)',
      suspended: 'var(--primary-03)',
      expired: '#EF9D0E',
      invitations: 'var(--chart-1)',
    };
    if (isDefaultView) {
      return {
        stroke: baseColors[seriesKey],
        strokeOpacity: 1,
        strokeWidth: 2.5,
        fillOpacity: 0.14,
      };
    }
    const isFocused = selectedCard === seriesKey;
    return {
      stroke: isFocused ? baseColors[seriesKey] : 'var(--shade-06)',
      strokeOpacity: isFocused ? 1 : 0.25,
      strokeWidth: isFocused ? 3 : 1.5,
      fillOpacity: isFocused ? 0.28 : 0,
    };
  };

  const activeCfg = getSeriesConfig('active');
  const suspendedCfg = getSeriesConfig('suspended');
  const expiredCfg = getSeriesConfig('expired');

  if (loading) {
    return (
      <div
        className="page flex items-center justify-center min-h-[420px]"
        aria-busy="true"
      >
        <CollegesHubLoader
          size="md"
          text="Loading college directory & telemetry…"
          minHeight="min-h-[380px]"
        />
      </div>
    );
  }

  return (
    <div className="page space-y-3">
      {/* ── ROW 1: 4 Stats Cards + Interactive Trend Chart ── */}
      <CollegesStatsCards
        statsCards={statsCards}
        selectedCard={selectedCard}
        onCardClick={handleCardClick}
        collegeTimeSeries={collegeTimeSeries}
        isInvitationsMode={isInvitationsMode}
        isDefaultView={isDefaultView}
        activeCfg={activeCfg}
        suspendedCfg={suspendedCfg}
        expiredCfg={expiredCfg}
        onResetView={() => setSelectedCard(null)}
      />

      {/* ── ROW 2: Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar on Left */}
        <div className="relative flex-1 min-w-[260px] max-w-md h-12 px-4.5 rounded-3xl bg-b-surface2 border border-s-subtle text-body-2 text-t-primary focus-within:border-s-focus shadow-widget transition-all flex items-center">
          <Icon
            name="search"
            className="!size-5 fill-t-secondary shrink-0 mr-2.5 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isInvitationsMode
                ? 'Search invitations by official email…'
                : 'Search colleges by name, code, city, email…'
            }
            className="w-full bg-transparent outline-none placeholder:text-t-tertiary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 rounded-full text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
            >
              <Icon name="close" className="!size-3.5 fill-current" />
            </button>
          )}
        </div>

        {/* Filters on Right */}
        <div className="flex items-center gap-2.5">
          <PlanFilterDropdown
            value={planFilter}
            onChange={(val) => setPlanFilter(val)}
          />

          {!isInvitationsMode && (
            <button
              type="button"
              onClick={() => setExpiringSoonOnly((prev) => !prev)}
              title={
                expiringSoonOnly
                  ? 'Showing expiring soon (≤30d) — click to clear'
                  : 'Filter expiring soon (≤30d)'
              }
              aria-label="Filter expiring soon"
              aria-pressed={expiringSoonOnly}
              className={`flex items-center justify-center size-12 rounded-full border transition-all cursor-pointer ${
                expiringSoonOnly
                  ? 'bg-[#EF9D0E]/15 border-[#EF9D0E] text-[#EF9D0E] shadow-depth'
                  : 'bg-b-surface2 border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight shadow-widget'
              }`}
            >
              <Icon name="hourglass" className="!size-5 fill-current" />
            </button>
          )}

          {(search || planFilter || expiringSoonOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPlanFilter('');
                setExpiringSoonOnly(false);
              }}
              className="h-12 px-4 rounded-3xl bg-b-surface1 border border-s-subtle text-caption font-semibold text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          {isInvitationsMode && (
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="btn-primary h-12 px-5 rounded-3xl shrink-0 inline-flex items-center gap-2 shadow-widget cursor-pointer"
            >
              <Icon name="plus" className="!size-4 fill-white" />
              <span>Invite College</span>
            </button>
          )}
        </div>
      </div>

      {/* ── ROW 3: Data Table ── */}
      <section className="card p-0 overflow-hidden shadow-widget">
        {!isInvitationsMode ? (
          <CollegesTable
            filteredColleges={filteredColleges}
            navigate={navigate}
            hasActiveFilters={Boolean(search || planFilter || expiringSoonOnly || selectedCard)}
            onResetFilters={() => {
              setSearch('');
              setPlanFilter('');
              setExpiringSoonOnly(false);
              setSelectedCard(null);
            }}
          />
        ) : (
          <InvitationsTable
            filteredInvitations={filteredInvitations}
            onOpenInviteModal={() => setShowInviteModal(true)}
            onResend={handleResendInvite}
            onCancel={handleCancelInvite}
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}
      </section>

      {/* ── Invite College Slide-Over Drawer ── */}
      <InviteCollegeDrawer
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSent={fetchInvitations}
      />
    </div>
  );
};

export default Colleges;
