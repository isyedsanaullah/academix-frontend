/**
 * Plan & Subscription State Resolution for CESMS / CollegesHub
 * Verified against backend/config/planConstants.js & featureRegistry.js:
 * - Canonical DB plans: 'starter' | 'standard' | 'premium' | 'enterprise'
 * - Legacy aliases: 'basic'/'free' -> 'starter', 'plus' -> 'premium'
 * - Unknown / 'custom' / missing -> null (neutral Brand Blue fallback, no plan accent)
 */

export const PLAN_MAP = {
  starter: 'starter',
  basic: 'starter',
  free: 'starter',
  standard: 'standard',
  premium: 'premium',
  plus: 'premium',
  enterprise: 'enterprise',
};

export const PLAN_LABELS = {
  starter: 'Starter',
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

export function normalizePlanKey(rawPlan) {
  if (!rawPlan || typeof rawPlan !== 'string') return null;
  const clean = rawPlan.toLowerCase().trim();
  if (PLAN_MAP[clean]) return PLAN_MAP[clean];
  if (clean.startsWith('ent')) return 'enterprise';
  if (clean.startsWith('prem')) return 'premium';
  if (clean.startsWith('stand')) return 'standard';
  if (clean.startsWith('start') || clean === 'basic') return 'starter';
  return null;
}

export function resolveCollegePlan(user) {
  if (!user || user.role === 'superAdmin') return null;
  const college = user.college;
  if (!college) return null;

  const raw =
    college.planId ||
    college.subscription?.planId ||
    college.subscription?.plan ||
    user.planInfo?.plan ||
    '';

  return normalizePlanKey(raw);
}

/**
 * Resolves the subscription lifecycle state:
 * 'active' | 'trial' | 'grace' | 'expired' | 'suspended'
 */
export function resolveSubscriptionState(user) {
  if (!user || user.role === 'superAdmin') return 'active';
  const college = user.college;
  if (!college) return 'active';

  const subStatus = (college.subStatus || '').toString().toUpperCase();
  const legacyStatus = (
    college.subscription_status ||
    college.subscription?.status ||
    ''
  )
    .toString()
    .toLowerCase();

  if (
    subStatus === 'SUSPENDED' ||
    legacyStatus === 'suspended' ||
    college.status === 'suspended' ||
    college.subscriptionSuspended
  ) {
    return 'suspended';
  }

  if (
    legacyStatus === 'expired' ||
    college.forceReadOnly ||
    college.isReadOnly ||
    college.readOnlyReason === 'SUBSCRIPTION_EXPIRED' ||
    college.readOnlyReason === 'TRIAL_EXPIRED'
  ) {
    return 'expired';
  }

  if (legacyStatus === 'grace') {
    return 'grace';
  }

  const periodEnd = college.periodEnd || college.subscription?.periodEnd || college.trialEndsAt;
  if (periodEnd) {
    const daysLeft = Math.ceil((new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
  }

  if (subStatus === 'TRIAL' || legacyStatus === 'trial') {
    return 'trial';
  }

  return 'active';
}

