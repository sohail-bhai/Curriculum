'use client'
/**
 * Select Component
 * Dropdown select input with support for multiple options and grouped options
 */
import { forwardRef, SelectHTMLAttributes, ReactNode, useState } from 'react'
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectOptionGroup {
  label: string
  options: SelectOption[]
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  options?: (SelectOption | SelectOptionGroup)[]
  icon?: ReactNode
  isValid?: boolean
  isLoading?: boolean
  containerClassName?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  isGrouped?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    helperText,
    options = [],
    icon,
    isValid,
    isLoading,
    containerClassName,
    fullWidth = false,
    size = 'md',
    disabled,
    className,
    isGrouped,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    // Size mappings
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    }

    // Base select classes
    const baseSelectClasses = `
      w-full rounded-lg border transition-all duration-150 appearance-none
      font-medium focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
      bg-white cursor-pointer
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

          {/* Select element */}
          <select
            ref={ref}
            disabled={disabled || isLoading}
            className={`${baseSelectClasses} ${borderClasses} ${icon ? 'pl-10' : ''} pr-10`}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          >
            {/* Default placeholder */}
            <option value="">Select an option</option>

            {/* Options rendering */}
            {options.map((item, index) => {
              // Check if it's an option group
              if ('options' in item) {
                return (
                  <optgroup key={`group-${index}`} label={item.label}>
                    {item.options.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.disabled}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                )
              }

              // Regular option
              return (
                <option
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                >
                  {item.label}
                </option>
              )
            })}
          </select>

          {/* Chevron icon */}
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />

          {/* Validation icons */}
          {(isValid || error) && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              {isValid && <CheckCircle size={18} className="text-green-500" />}
              {error && <AlertCircle size={18} className="text-red-500" />}
            </div>
          )}
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

Select.displayName = 'Select'
export default Select
