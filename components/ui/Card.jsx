'use client';

import Select from './Select';
import Icon from '../Icon';

const Card = ({
  className = '',
  classHead = '',
  classBody = '',
  title,
  subtitle,
  icon,
  selectOptions,
  selectValue,
  selectOnChange,
  headContent,
  noPadding = false,
  children,
  ...rest
}) => {
  const hasHeader = Boolean(
    title || subtitle || headContent || (selectOptions && selectOnChange)
  );

  return (
    <div className={`card ${className}`} {...rest}>
      {hasHeader && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 min-h-12 pl-5 pr-2 max-lg:pl-3 ${classHead}`}
        >
          <div className="flex items-center gap-3 min-w-0 mr-auto">
            {icon && (
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-b-surface1 border border-s-subtle shrink-0">
                <Icon name={icon} className="!size-5 fill-t-primary" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-h6 text-t-primary truncate">{title}</h3>
              )}
              {subtitle && (
                <p className="text-caption text-t-secondary truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headContent}
            {selectOptions && selectValue && selectOnChange && (
              <Select
                className="min-w-40 max-md:min-w-34"
                value={selectValue}
                onChange={selectOnChange}
                options={selectOptions}
              />
            )}
          </div>
        </div>
      )}
      <div className={noPadding ? classBody : `${hasHeader ? 'pt-3' : ''} ${classBody}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;

