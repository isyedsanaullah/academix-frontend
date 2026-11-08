'use client';

import Icon from '../Icon';

const Search = ({
  className = '',
  classInput = '',
  classButton = '',
  value = '',
  onChange,
  placeholder = 'Search...',
  isGray = false,
  onClear,
  ...rest
}) => {
  const handleClear = () => {
    const syntheticEvent = {
      target: {
        value: '',
        name: 'search',
      },
    };
    if (onChange) onChange(syntheticEvent);
    if (onClear) onClear();
  };

  return (
    <div className={`relative ${className}`}>
      <span
        className="pointer-events-none absolute top-3.5 left-4 text-t-secondary"
        aria-hidden="true"
      >
        <Icon className="!size-5 fill-t-secondary" name="search" />
      </span>
      <input
        className={`w-full h-12 pl-11 border rounded-3xl text-body-2 text-t-primary placeholder:text-t-tertiary outline-none transition-all ${
          value !== '' ? 'pr-10.5' : 'pr-4'
        } ${
          isGray
            ? 'bg-b-surface1 border-s-subtle focus:bg-b-surface2 focus:shadow-input-typing focus:border-s-focus'
            : 'bg-b-surface2 border-s-stroke2 hover:border-s-highlight focus:border-s-focus focus:shadow-input-typing'
        } ${classInput}`}
        type="text"
        name="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        {...rest}
      />
      <button
        type="button"
        aria-label="Clear search"
        className={`group absolute top-3 right-3 p-1 rounded-full text-t-secondary hover:text-t-primary transition-all cursor-pointer ${
          value !== '' ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        } ${classButton}`}
        onClick={handleClear}
      >
        <Icon
          className="!size-4.5 fill-t-secondary transition-colors group-hover:fill-t-primary"
          name="close"
        />
      </button>
    </div>
  );
};

export default Search;

