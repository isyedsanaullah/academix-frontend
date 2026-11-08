'use client';

import Icon from '../Icon';
import Tooltip from './Tooltip';

const Field = ({
  className = '',
  classInput = '',
  label,
  innerLabel,
  tooltip,
  children,
  textarea = false,
  type = 'text',
  validated = false,
  error,
  helperText,
  icon,
  required,
  handleForgotPassword,
  ...inputProps
}) => {
  return (
    <div className={`${innerLabel ? 'pt-1.5' : ''} ${className}`}>
      {label && !innerLabel && (
        <label className="flex items-center mb-2.5 text-button text-t-primary">
          <span>
            {label}
            {required && <span className="text-primary-03 ml-0.5">*</span>}
          </span>
          {tooltip && <Tooltip className="ml-1.5" content={tooltip} />}
        </label>
      )}
      <div className={`relative ${textarea ? 'text-0' : ''}`}>
        {innerLabel && !label && (
          <div className="absolute -top-2.5 left-5 z-2 px-1.5 bg-b-surface2 text-caption text-t-secondary pointer-events-none">
            {innerLabel}
          </div>
        )}
        {handleForgotPassword && (
          <button
            type="button"
            className="absolute -top-2.5 right-6 px-1 bg-b-surface2 text-caption text-t-secondary transition-colors hover:text-t-primary"
            onClick={handleForgotPassword}
          >
            Forgot password?
          </button>
        )}
        {icon && !textarea && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-t-secondary">
            <Icon name={icon} className="!size-5 fill-t-secondary" />
          </span>
        )}
        {children}
        {textarea ? (
          <textarea
            required={required}
            className={`w-full min-h-26 px-4.5 py-3.5 bg-b-surface2 border rounded-3xl text-body-2 text-t-primary outline-none transition-all resize-y hover:border-s-highlight focus:border-s-focus focus:shadow-input-typing placeholder:text-t-tertiary ${
              error ? 'border-primary-03' : 'border-s-stroke2'
            } ${validated ? 'pr-12' : ''} ${innerLabel ? 'pl-6' : ''} ${classInput}`}
            {...inputProps}
          />
        ) : (
          <input
            type={type}
            required={required}
            className={`w-full h-12 px-4.5 bg-b-surface2 border rounded-full text-body-2 text-t-primary outline-none transition-all hover:border-s-highlight focus:border-s-focus focus:shadow-input-typing placeholder:text-t-tertiary ${
              error ? 'border-primary-03' : 'border-s-stroke2'
            } ${icon ? 'pl-11.5' : ''} ${validated ? 'pr-12' : ''} ${
              innerLabel ? 'pl-6' : ''
            } ${classInput}`}
            {...inputProps}
          />
        )}
        {validated && (
          <Icon
            className="absolute top-1/2 right-4 -translate-y-1/2 !size-5 fill-primary-02"
            name="check"
          />
        )}
      </div>
      {error && <p className="mt-1.5 text-caption text-primary-03">{error}</p>}
      {!error && helperText && (
        <p className="mt-1.5 text-caption text-t-secondary">{helperText}</p>
      )}
    </div>
  );
};

export default Field;

