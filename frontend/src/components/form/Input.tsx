'use client'
/**
 * Input Component
 * Flexible text input with support for various types and validation states
 */
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  rightIcon?: ReactNode
  isValid?: boolean
  isLoading?: boolean
  containerClassName?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    icon,
    rightIcon,
    isValid,
    isLoading,
    containerClassName,
    fullWidth = false,
    size = 'md',
    type = 'text',
    showPasswordToggle,
    disabled,
    className,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    // Size mappings
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    }

    // Input type handling for password toggle
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type

    // Base input classes
    const baseInputClasses = `
      w-full rounded-lg border transition-all duration-150
      font-medium placeholder:text-gray-500
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
      ${sizeClasses[size]}
      ${className || ''}
    `

    // State-based border and ring colors
    let borderClasses = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    if (error) {
      borderClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500'
    } else if (isValid) {
      borderClasses = 'border-green-300 focus:border-green-500 focus:ring-green-500'
    }

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName || ''}`}>
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input element */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled || isLoading}
            className={`${baseInputClasses} ${borderClasses} ${icon ? 'pl-10' : ''} ${
              rightIcon || isValid || error || showPasswordToggle ? 'pr-10' : ''
            }`}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Password toggle */}
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}

            {/* Validation icons */}
            {!showPasswordToggle && (
              <>
                {isValid && <CheckCircle size={18} className="text-green-500" />}
                {error && <AlertCircle size={18} className="text-red-500" />}
              </>
            )}

            {/* Custom right icon */}
            {!showPasswordToggle && !isValid && !error && rightIcon && (
              <div className="text-gray-500">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper text or error message */}
        {(error || helperText) && (
          <p className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-gray-600'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
