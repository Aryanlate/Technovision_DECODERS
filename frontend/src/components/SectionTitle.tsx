import React from 'react';
import { Sunburst } from './Sunburst';

export interface SectionTitleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tag?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  withMotif?: boolean;
  align?: 'left' | 'center';
  size?: 'default' | 'huge' | 'hero';
}

/**
 * Editorial SectionTitle Component
 * Features a bold heavy uppercase headline (Archivo Black) with a small monospace/uppercase tag above,
 * optionally paired with the Sunburst line-art motif.
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({
  tag,
  title,
  subtitle,
  withMotif = false,
  align = 'left',
  size = 'default',
  className = '',
  ...props
}) => {
  const alignStyles = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  const titleSizeStyles = {
    default: 'text-2xl sm:text-3xl md:text-4xl',
    huge: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
    hero: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter'
  }[size];

  return (
    <div className={`flex flex-col gap-2 ${alignStyles} ${className}`} {...props}>
      {tag && (
        <div className="flex items-center gap-2">
          {withMotif && <Sunburst size={14} className="text-[#111111]" />}
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 bg-[#111111]/5 px-2 py-0.5 border border-[#111111]/20">
            {tag}
          </span>
        </div>
      )}

      <h2
        className={`font-headline uppercase leading-[1.05] tracking-tight text-[#111111] ${titleSizeStyles}`}
      >
        {title}
      </h2>

      {subtitle && (
        <p className="text-sm sm:text-base text-[#111111]/80 max-w-2xl leading-relaxed mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
