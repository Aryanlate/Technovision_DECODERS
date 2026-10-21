import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cream' | 'white' | 'inverted';
  interactive?: boolean;
}

/**
 * Editorial Card Component
 * Follows the Master Context: thin black border, no drop shadows, no gradients.
 */
export const Card: React.FC<CardProps> = ({
  variant = 'cream',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const bgStyles = {
    cream: 'bg-[#F1EEE6] text-[#111111]',
    white: 'bg-white text-[#111111]',
    inverted: 'bg-[#111111] text-[#F1EEE6]'
  }[variant];

  const interactiveStyles = interactive
    ? 'cursor-pointer transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]'
    : '';

  return (
    <div
      className={`border border-[#111111] ${bgStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`p-5 sm:p-6 border-b border-[#111111] flex flex-col gap-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3
      className={`font-headline text-lg sm:text-xl uppercase tracking-tight text-inherit ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={`text-sm opacity-80 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`p-4 sm:p-6 border-t border-[#111111] bg-[#111111]/[0.02] flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
