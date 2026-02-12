import React from 'react';
import { cn } from '@/lib/utils';

/* -----------------------------------------
   Responsive Layout
------------------------------------------ */

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  as?: keyof JSX.IntrinsicElements;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: '' // important: avoid false in CN()
};

const paddingClasses = {
  xs: 'fluid-spacing-xs',
  sm: 'fluid-spacing-sm',
  md: 'fluid-spacing-md',
  lg: 'fluid-spacing-lg',
  xl: 'fluid-spacing-xl'
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md',
  as: Component = 'div'
}) => {
  return (
    <Component
      className={cn(
        'responsive-container',
        'w-full',
        'mx-auto',
        maxWidthClasses[maxWidth],   // safe ✔
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  );
};

/* -----------------------------------------
   Responsive Grid
------------------------------------------ */

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  auto?: boolean;
}

const gapClasses = {
  xs: 'fluid-gap-xs',
  sm: 'fluid-gap-sm',
  md: 'fluid-gap-md',
  lg: 'fluid-gap-lg',
  xl: 'fluid-gap-xl'
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  columns = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4, '2xl': 4 },
  gap = 'md',
  auto = false
}) => {
  const gridClasses: string[] = [];

  if (auto) {
    gridClasses.push('responsive-grid-auto');
  } else {
    gridClasses.push('grid');

    if (columns.xs) gridClasses.push(`grid-cols-${columns.xs}`);
    if (columns.sm) gridClasses.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) gridClasses.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) gridClasses.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) gridClasses.push(`xl:grid-cols-${columns.xl}`);
    if (columns['2xl']) gridClasses.push(`2xl:grid-cols-${columns['2xl']}`);
  }

  return (
    <div className={cn(...gridClasses, gapClasses[gap], className)}>
      {children}
    </div>
  );
};

/* -----------------------------------------
   Responsive Text
------------------------------------------ */

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

const textSizeClasses = {
  xs: 'fluid-text-xs',
  sm: 'fluid-text-sm',
  base: 'fluid-text-base',
  lg: 'fluid-text-lg',
  xl: 'fluid-text-xl',
  '2xl': 'fluid-text-2xl',
  '3xl': 'fluid-text-3xl',
  '4xl': 'fluid-text-4xl',
  '5xl': 'fluid-text-5xl'
};

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  size = 'base',
  as: Component = 'p'
}) => {
  return (
    <Component className={cn(textSizeClasses[size], className)}>
      {children}
    </Component>
  );
};

export default ResponsiveLayout;
