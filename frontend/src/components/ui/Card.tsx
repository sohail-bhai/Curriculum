'use client'

import { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'interactive'
  padding?: 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  variant = 'default',
  padding = 'lg',
  className = '',
  ...rest
}: CardProps) {
  const paddingClass = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-6',
  }[padding]

  const variantClass = {
    default: 'bg-white border border-gray-200 hover:shadow-sm',
    interactive: 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer',
  }[variant]

  return (
    <div
      className={`rounded-lg shadow-xs transition-all duration-150 ${paddingClass} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
