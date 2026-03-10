'use client'

import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'warning' | 'ghost'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-blue-600 hover:border-blue-700',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 hover:border-gray-400',
  outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600 hover:border-blue-700',
  success: 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 hover:border-amber-700',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 border-transparent',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base font-semibold',
  icon: 'w-10 h-10 p-0',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    disabled,
    className = '',
    fullWidth = false,
    ...rest
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-md border transition-all duration-150
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      ${fullWidth ? 'w-full' : ''}
      ${sizes[size]}
      ${variants[variant]}
      ${className}
    `

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={baseClasses}
        {...rest}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        ) : icon ? (
          <span className="flex items-center justify-center flex-shrink-0">
            {icon}
          </span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
