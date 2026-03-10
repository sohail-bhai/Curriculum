'use client'
/**
 * FormGroup Component
 * Wrapper component for grouping form fields with consistent spacing
 */
import { ReactNode } from 'react'

export interface FormGroupProps {
  children: ReactNode
  layout?: 'vertical' | 'horizontal' | 'inline'
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  cols?: number
  className?: string
}

const gapClasses = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

const colsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

export default function FormGroup({
  children,
  layout = 'vertical',
  gap = 'md',
  cols = 1,
  className = '',
}: FormGroupProps) {
  const gapClass = gapClasses[gap]

  if (layout === 'inline') {
    return (
      <div className={`flex items-end flex-wrap ${gapClass} ${className}`}>
        {children}
      </div>
    )
  }

  if (layout === 'horizontal') {
    return (
      <div className={`flex flex-col sm:flex-row items-start ${gapClass} ${className}`}>
        {children}
      </div>
    )
  }

  // Vertical layout (default) with responsive grid support
  if (cols > 1) {
    return (
      <div className={`grid ${colsClasses[cols as keyof typeof colsClasses] || 'grid-cols-1'} ${gapClass} ${className}`}>
        {children}
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${gapClass} ${className}`}>
      {children}
    </div>
  )
}
