import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  charCount?: number;
  maxCharCount?: number;
}

/**
 * Editorial Textarea Component
 * Features a thin 1px black border, monospaced/uppercase label, and character counter.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = true,
      charCount,
      maxCharCount,
      className = '',
      id,
      disabled,
      required,
      rows = 5,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1 select-none"
            >
              <span>{label}</span>
              {required && (
                <span className="text-[#C0453A] font-bold" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          {maxCharCount !== undefined && charCount !== undefined && (
            <span className="text-[11px] font-mono text-[#111111]/60">
              {charCount} / {maxCharCount}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full px-3.5 py-3 text-base bg-white text-[#111111] border transition-colors font-body placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-[#111111] disabled:bg-[#111111]/5 disabled:cursor-not-allowed ${
            error ? 'border-[#C0453A] focus:ring-[#C0453A]' : 'border-[#111111]'
          } ${className}`}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
