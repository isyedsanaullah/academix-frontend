'use client';

import Icon from '@/components/Icon';
import SubscriptionTab from '@/components/superAdmin/college/SubscriptionTab';

const ACTUAL_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    desc: 'Essential core tools, admissions & academics',
  },
  {
    id: 'standard',
    name: 'Standard',
    desc: 'Expanding programs, attendance, fees & reports',
  },
  {
    id: 'premium',
    name: 'Premium',
    desc: 'Advanced examination, payroll & AI suite',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'Full platform suite, multisite & custom APIs',
  },
];

export default function SubscriptionBillingTab({
  collegeId,
  college,
  currentPlan,
  editingField,
  editValue,
  setEditValue,
  savingField,
  handleStartInlineEdit,
  handleCancelInlineEdit,
  handleSaveInlineEdit,
  onSelectPlan,
  onRefresh,
}) {
  const c = college;
  if (!c) return null;

  return (
    <div className="space-y-6">
      {/* ── Baseline Platform Plan & Expiry Card ── */}
      <div className="p-6 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-h6 font-bold text-t-primary">Baseline Platform Plan</h3>
            <p className="text-caption text-t-secondary">
              Assign the core entitlement tier. Switching tiers prompts confirmation to verify feature impact.
            </p>
          </div>

          {/* Term Expiry Preview / Quick Inline Edit */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-b-depth2 border border-s-subtle">
            <div>
              <span className="text-[10px] font-bold text-t-secondary uppercase block">
                Term Expiry
              </span>
              {editingField === 'sub_expiresAt' ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="date"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg bg-b-surface2 border border-primary-01 text-t-primary outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveInlineEdit('sub_expiresAt')}
                    disabled={savingField}
                    className="p-1 rounded-lg bg-primary-01 text-white hover:bg-primary-01/90"
                  >
                    <Icon name="check" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelInlineEdit}
                    className="p-1 rounded-lg border border-s-subtle text-t-secondary hover:text-t-primary"
                  >
                    <Icon name="close" className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-caption font-bold text-t-primary font-mono">
                    {c.subscription?.expiresAt
                      ? new Date(c.subscription.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Perpetual / No Expiry'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartInlineEdit('sub_expiresAt', c.subscription?.expiresAt)}
                    className="text-t-secondary hover:text-primary-01 transition-colors"
                    title="Edit Expiry Date"
                  >
                    <Icon name="edit" className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Real Platform Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACTUAL_PLANS.map((plan) => {
            const isSelected = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan.id)}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-primary-01/5 border-primary-01 ring-1 ring-primary-01/30 shadow-widget'
                    : 'bg-b-depth2 border-s-subtle hover:border-s-highlight hover:bg-b-depth1'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sub-title-1 font-bold text-t-primary capitalize">
                      {plan.name}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-01 text-white">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-t-secondary">
                        Switch Tier
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-t-secondary leading-relaxed">
                    {plan.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-s-subtle flex items-center justify-between text-caption font-semibold">
                  <span className={isSelected ? 'text-primary-01 font-bold' : 'text-t-secondary'}>
                    {isSelected ? '✓ Assigned' : 'Select Plan →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Full Subscription Tab Details (Renewal, Invoices, Overrides) ── */}
      <SubscriptionTab
        collegeId={collegeId}
        collegeName={c.name}
        onSubscriptionChanged={onRefresh}
      />
    </div>
  );
}

