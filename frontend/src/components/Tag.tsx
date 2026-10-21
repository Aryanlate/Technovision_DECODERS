import React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'solid' | 'match' | 'mismatch' | 'missing';
  size?: 'sm' | 'md';
  onRemove?: () => void;
  removeAriaLabel?: string;
}

/**
 * Editorial Tag Component
 * Used for skills, metadata chips, criteria tags, and categories.
 * Supports optional dismissal/removal with full keyboard accessibility.
 */
export const Tag: React.FC<TagProps> = ({
  variant = 'default',
  size = 'md',
  onRemove,
  removeAriaLabel = 'Remove tag',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#F1EEE6] text-[#111111] border-[#111111]',
    solid: 'bg-[#111111] text-[#F1EEE6] border-[#111111]',
    match: 'bg-[#2F7D5B]/10 text-[#2F7D5B] border-[#2F7D5B] font-bold',
    mismatch: 'bg-[#C0453A]/10 text-[#C0453A] border-[#C0453A] font-bold',
    missing: 'bg-[#D98A1F]/10 text-[#D98A1F] border-[#D98A1F] font-bold'
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono select-none border transition-colors ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={removeAriaLabel}
          className="ml-0.5 hover:opacity-100 opacity-70 p-0.5 focus:outline-none focus:ring-1 focus:ring-current"
        >
          <svg
            className="w-3 h-3 stroke-[2.5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
};
