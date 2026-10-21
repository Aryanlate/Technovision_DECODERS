import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

/**
 * Editorial Input Component
 * Features a crisp 1px black border, high-contrast typography, and accessible focus state.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1 select-none"
          >
            <span>{label}</span>
            {required && <span className="text-[#C0453A] font-bold" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full px-3.5 py-2.5 text-base bg-white text-[#111111] border transition-colors font-body placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-[#111111] disabled:bg-[#111111]/5 disabled:cursor-not-allowed ${
              error ? 'border-[#C0453A] focus:ring-[#C0453A]' : 'border-[#111111]'
            } ${className}`}
            {...props}
          />
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-xs font-medium text-[#C0453A] mt-0.5">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[#111111]/70 mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
