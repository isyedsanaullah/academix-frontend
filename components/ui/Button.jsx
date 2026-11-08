'use client';

import Link from 'next/link';
import Icon from '../Icon';

const Button = ({
  className = '',
  icon,
  iconRight,
  children,
  isPrimary,
  isBlack,
  isWhite,
  isGray,
  isStroke,
  isRed,
  isGreen,
  isCircle,
  size = 'md',
  as = 'button',
  href,
  type = 'button',
  ...props
}) => {
  const usePrimary = isPrimary || isBlack || (!isWhite && !isGray && !isStroke && !isRed && !isGreen);

  const sizeClass = isCircle
    ? size === 'sm'
      ? 'w-10 h-10 !px-0 rounded-full'
      : 'w-12 h-12 !px-0 rounded-full'
    : size === 'sm'
      ? 'h-10 px-4.5 rounded-3xl text-caption font-semibold gap-2'
      : size === 'lg'
        ? 'h-13 px-8 rounded-3xl text-button gap-2.5'
        : 'h-12 px-6.5 rounded-3xl text-button gap-2';

  const variantClass = usePrimary
    ? 'btn-primary border-transparent'
    : isWhite
      ? 'bg-b-surface2 border border-s-subtle text-t-secondary fill-t-secondary hover:text-t-primary hover:fill-t-primary hover:border-s-highlight shadow-widget'
      : isGray
        ? 'bg-b-surface1 border border-transparent text-t-secondary fill-t-secondary hover:text-t-primary hover:fill-t-primary hover:shadow-widget'
        : isStroke
          ? 'bg-transparent border border-s-stroke2 text-t-secondary fill-t-secondary hover:border-s-highlight hover:text-t-primary hover:fill-t-primary'
          : isRed
            ? 'bg-primary-03 border border-transparent text-white fill-white hover:opacity-92 shadow-widget'
            : isGreen
              ? 'bg-primary-02 border border-transparent text-t-light fill-t-light hover:opacity-92 shadow-widget'
              : '';

  const classes = `inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none ${sizeClass} ${variantClass} ${className}`.trim();

  const content = (
    <>
      {icon && <Icon className="!size-5 fill-current shrink-0" name={icon} />}
      {children}
      {iconRight && <Icon className="!size-5 fill-current shrink-0" name={iconRight} />}
    </>
  );

  if (as === 'a') {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  if (as === 'link' && href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
};

export default Button;

