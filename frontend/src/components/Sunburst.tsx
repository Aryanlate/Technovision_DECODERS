import React from 'react';

interface SunburstProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  'aria-label'?: string;
}

/**
 * Editorial Sunburst Line-Art SVG Motif
 * Used sparingly across headers, badges, and section dividers.
 * Follows the Master Context: thin black lines, no gradients, minimal editorial aesthetic.
 */
export const Sunburst: React.FC<SunburstProps> = ({
  className = '',
  size = 20,
  strokeWidth = 1.5,
  'aria-label': ariaLabel
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block select-none shrink-0 ${className}`}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : 'presentation'}
    >
      {/* Central geometric ring */}
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" />
      {/* Cardinal 4 rays */}
      <line x1="12" y1="2" x2="12" y2="5.5" stroke="currentColor" />
      <line x1="12" y1="18.5" x2="12" y2="22" stroke="currentColor" />
      <line x1="2" y1="12" x2="5.5" y2="12" stroke="currentColor" />
      <line x1="18.5" y1="12" x2="22" y2="12" stroke="currentColor" />
      {/* Diagonal 4 rays */}
      <line x1="4.93" y1="4.93" x2="7.4" y2="7.4" stroke="currentColor" />
      <line x1="16.6" y1="16.6" x2="19.07" y2="19.07" stroke="currentColor" />
      <line x1="4.93" y1="19.07" x2="7.4" y2="16.6" stroke="currentColor" />
      <line x1="16.6" y1="7.4" x2="19.07" y2="4.93" stroke="currentColor" />
    </svg>
  );
};
