import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Editorial Button Component
 * - Solid: high-contrast solid ink (#111111) with cream text
 * - Outline: crisp 1px ink border with cream background, inverts on hover
 * - Fully keyboard accessible with high-contrast focus rings
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'solid',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      className = '',
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold uppercase select-none transition-colors duration-150 border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:translate-y-[1px]';

    const variantStyles = {
      solid: 'bg-[#111111] text-[#F1EEE6] border-[#111111] hover:bg-[#111111]/90 active:bg-black',
      outline:
        'bg-[#F1EEE6] text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6] active:bg-[#111111]/90',
      danger:
        'bg-[#C0453A] text-white border-[#111111] hover:bg-[#A3382F] active:bg-[#8B2C24]',
      ghost:
        'bg-transparent text-[#111111] border-transparent hover:border-[#111111] hover:bg-[#111111]/5'
    }[variant];

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 tracking-wider',
      md: 'text-sm px-5 py-2.5 gap-2 tracking-wider',
      lg: 'text-base px-7 py-3.5 gap-2.5 tracking-widest'
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && iconLeft && <span className="shrink-0">{iconLeft}</span>}
        <span>{children}</span>
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
