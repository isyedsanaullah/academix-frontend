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
  isGhost,
  isSecondary,
  isRed,
  isDanger,
  isGreen,
  isCircle,
  variant,
  loading,
  fullWidth,
  size = 'md',
  as = 'button',
  href,
  type = 'button',
  disabled,
  ...props
}) => {
  const ghostMode = isGhost || variant === 'ghost';
  const strokeMode = isStroke || isSecondary || variant === 'stroke' || variant === 'secondary' || variant === 'outline';
  const redMode = isRed || isDanger || variant === 'danger' || variant === 'red';
  const greenMode = isGreen || variant === 'success' || variant === 'green';
  const whiteMode = isWhite || variant === 'white';
  const grayMode = isGray || variant === 'gray';

  const usePrimary =
    isPrimary ||
    isBlack ||
    variant === 'primary' ||
    (!whiteMode && !grayMode && !strokeMode && !ghostMode && !redMode && !greenMode);

  const sizeClass = isCircle
    ? size === 'sm'
      ? 'w-10 h-10 !px-0 rounded-full'
      : 'w-12 h-12 !px-0 rounded-full'
    : size === 'xs'
      ? 'h-8 px-3 rounded-2xl text-caption font-semibold gap-1.5'
      : size === 'sm'
        ? 'h-10 px-4.5 rounded-3xl text-caption font-semibold gap-2'
        : size === 'lg'
          ? 'h-13 px-8 rounded-3xl text-button gap-2.5'
          : 'h-12 px-6.5 rounded-3xl text-button gap-2';

  const variantClass = usePrimary
    ? 'btn-primary border-transparent'
    : whiteMode
      ? 'bg-b-surface2 border border-s-subtle text-t-secondary fill-t-secondary hover:text-t-primary hover:fill-t-primary hover:border-s-highlight shadow-widget'
      : grayMode
        ? 'bg-b-surface1 border border-transparent text-t-secondary fill-t-secondary hover:text-t-primary hover:fill-t-primary hover:shadow-widget'
        : strokeMode
          ? 'bg-transparent border border-s-stroke2 text-t-secondary fill-t-secondary hover:border-s-highlight hover:text-t-primary hover:fill-t-primary'
          : ghostMode
            ? 'bg-transparent border border-transparent text-t-secondary fill-t-secondary hover:bg-b-highlight hover:text-t-primary hover:fill-t-primary'
            : redMode
              ? 'bg-primary-03 border border-transparent text-white fill-white hover:opacity-92 shadow-widget'
              : greenMode
                ? 'bg-primary-02 border border-transparent text-t-light fill-t-light hover:opacity-92 shadow-widget'
                : '';

  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none ${sizeClass} ${variantClass} ${widthClass} ${className}`.trim();

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
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
