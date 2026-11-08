'use client';

import Icon from '../Icon';

const Tabs = ({
  className = '',
  classButton = '',
  items = [],
  value,
  setValue,
  onChange,
  isOnlyIcon = false,
}) => {
  const handleSelect = (item) => {
    if (setValue) setValue(item);
    if (onChange) onChange(typeof item === 'object' ? item.id ?? item.value ?? item.key : item);
  };

  const activeId =
    typeof value === 'object' && value !== null
      ? value.id ?? value.value ?? value.key
      : value;

  return (
    <div
      role="tablist"
      className={`flex flex-wrap items-center ${isOnlyIcon ? 'gap-2' : 'gap-1.5'} ${className}`}
    >
      {items.map((rawItem, idx) => {
        const item =
          typeof rawItem === 'object' && rawItem !== null
            ? rawItem
            : { id: rawItem, name: String(rawItem) };
        const id = item.id ?? item.value ?? item.key ?? idx;
        const label = item.name ?? item.label ?? String(id);
        const isActive = id === activeId;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={isOnlyIcon ? label : undefined}
            onClick={() => handleSelect(rawItem)}
            className={`inline-flex justify-center items-center gap-2 h-11 rounded-full border text-button transition-all cursor-pointer ${
              isOnlyIcon ? 'w-11 !px-0' : 'px-5'
            } ${
              isActive
                ? 'border-s-stroke2 bg-b-surface1 text-t-primary fill-t-primary shadow-widget'
                : 'border-transparent text-t-secondary fill-t-secondary hover:text-t-primary hover:fill-t-primary hover:bg-b-surface1/50'
            } ${classButton}`}
          >
            {item.icon && (
              <Icon
                className="!size-4.5 fill-current shrink-0"
                name={item.icon?.iconName || item.icon}
              />
            )}
            {isOnlyIcon ? (
              <Icon className="!size-5 fill-current" name={item.icon || label} />
            ) : (
              <span>{label}</span>
            )}
            {item.count !== undefined && item.count !== null && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive
                    ? 'bg-primary-01 text-t-light'
                    : 'bg-b-surface1 text-t-secondary'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

