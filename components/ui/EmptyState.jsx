'use client';

import Icon from '../Icon';
import Button from './Button';

const EmptyState = ({
  icon = 'cube',
  title = 'No data available',
  description = 'There are no records matching your current filters.',
  actionLabel,
  onAction,
  actionHref,
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-3xl bg-b-surface1/50 border border-dashed border-s-stroke2 ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-b-surface2 border border-s-subtle shadow-widget">
        <Icon name={icon} className="!size-6 fill-t-secondary" />
      </div>
      <h4 className="text-h6 text-t-primary">{title}</h4>
      {description && (
        <p className="mt-1.5 max-w-md text-body-2 text-t-secondary">
          {description}
        </p>
      )}
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-5">
          <Button
            isPrimary
            as={actionHref ? 'link' : 'button'}
            href={actionHref}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default EmptyState;

