import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from './ui/Card';
import PlanBadge from './common/PlanBadge';
import Icon from './Icon';
import CollegesHubLoader from './common/CollegesHubLoader';

const roleBadge = {
  admin: { label: 'Administration', cls: 'label-blue' },
  principal: { label: 'Principal', cls: 'label-blue' },
  registrar: { label: 'Registrar', cls: 'label-green' },
  accountant: { label: 'Accounts', cls: 'label-yellow' },
};

const CollegeInfoCard = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/colleges/info')
      .then(({ data }) => setInfo(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Card className="flex justify-center">
        <CollegesHubLoader size="xs" text="Loading college profile…" minHeight="min-h-[120px]" />
      </Card>
    );

  if (!info) return null;

  return (
    <Card>
      <div className="flex items-center gap-3.5 mb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
          <Icon name="building" size={22} className="fill-current" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sub-title-1 text-t-primary">{info.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="label label-blue font-mono uppercase">{info.code}</span>
            {info.subscription?.plan && (
              <PlanBadge plan={info.subscription.plan} status={info.subscription.status} />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mb-5 text-body-2 text-t-secondary">
        {info.email && (
          <div className="flex items-center gap-2.5">
            <Icon name="mail" size={16} className="shrink-0 fill-t-tertiary" />
            <a href={`mailto:${info.email}`} className="truncate hover:text-[var(--brand-blue)]">
              {info.email}
            </a>
          </div>
        )}
        {info.phone && (
          <div className="flex items-center gap-2.5">
            <Icon name="phone" size={16} className="shrink-0 fill-t-tertiary" />
            <span>{info.phone}</span>
          </div>
        )}
        {info.address && (
          <div className="flex items-center gap-2.5">
            <Icon name="map-pin" size={16} className="shrink-0 fill-t-tertiary" />
            <span>
              {info.address}
              {info.city ? `, ${info.city}` : ''}
            </span>
          </div>
        )}
        {info.website && (
          <div className="flex items-center gap-2.5">
            <Icon name="globe" size={16} className="shrink-0 fill-t-tertiary" />
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[var(--brand-blue)] hover:underline"
            >
              {info.website}
            </a>
          </div>
        )}
      </div>

      {info.contacts?.length > 0 && (
        <div className="border-t border-s-subtle pt-4">
          <p className="mb-3 text-caption font-bold uppercase tracking-wider text-t-tertiary">
            Key Contacts
          </p>
          <div className="flex flex-col gap-2">
            {info.contacts.map((c, i) => {
              const badge = roleBadge[c.role] || { label: c.role, cls: 'label-gray' };
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-s-subtle bg-b-surface1 p-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-b-surface2 text-t-secondary">
                    <Icon name="profile" size={15} className="fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sub-title-2 text-t-primary">{c.name}</p>
                    <p className="truncate text-caption text-t-tertiary">{c.email}</p>
                  </div>
                  <span className={`label uppercase shrink-0 ${badge.cls}`}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CollegeInfoCard;
