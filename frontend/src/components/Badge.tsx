'use client'

import { HTMLAttributes } from 'react'

type StatusType = 'draft' | 'pending' | 'submitted' | 'in-review' | 'under-review' | 'approved' | 'published' | 'rejected' | 'revision'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: string
  variant?: 'default' | 'subtle'
  children: React.ReactNode
}

const statusStyles: Record<StatusType, { bg: string; text: string; icon: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '⚪' },
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '⏳' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📤' },
  'in-review': { bg: 'bg-amber-50', text: 'text-amber-700', icon: '👀' },
  'under-review': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '🔍' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', icon: '✅' },
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '📄' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌' },
  revision: { bg: 'bg-yellow-50', text: 'text-yellow-800', icon: '🔄' },
}

export default function Badge({
  status,
  variant = 'default',
  children,
  className = '',
  ...rest
}: BadgeProps) {
  const normalizedStatus = status?.toLowerCase() as StatusType | undefined
  const styles = normalizedStatus && statusStyles[normalizedStatus]
    ? statusStyles[normalizedStatus]
    : { bg: 'bg-gray-100', text: 'text-gray-700', icon: '' }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-semibold uppercase letter-spacing-0.05em
        transition-all duration-150
        ${styles.bg} ${styles.text}
        ${className}
      `}
      {...rest}
    >
      {status && <span className="text-sm">{styles.icon}</span>}
      {children}
    </span>
  )
}
