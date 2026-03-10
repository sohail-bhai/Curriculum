'use client'
/**
 * Textarea Component
 * Multi-line text input with character count and validation support
 */
import { forwardRef, TextareaHTMLAttributes, ReactNode, useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  isValid?: boolean
  isLoading?: boolean
  containerClassName?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCharCount?: boolean
  maxCharacters?: number
  rows?: number
  resizable?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error,
    helperText,
    icon,
    isValid,
    isLoading,
    containerClassName,
    fullWidth = false,
    size = 'md',
    disabled,
    className,
    showCharCount = false,
    maxCharacters,
    rows = 4,
    resizable = true,
    value = '',
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const [charCount, setCharCount] = useState(String(value).length)

    // Size mappings
    const sizeClasses = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-3 text-base',
    }

    // Base textarea classes
    const baseTextareaClasses = `
      w-full rounded-lg border transition-all duration-150
      font-medium placeholder:text-gray-500
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
      ${sizeClasses[size]}
      ${resizable ? 'resize' : 'resize-none'}
      ${className || ''}
    `

    // State-based border and ring colors
    let borderClasses = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    if (error) {
      borderClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500'
    } else if (isValid) {
      borderClasses = 'border-green-300 focus:border-green-500 focus:ring-green-500'
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      props.onChange?.(e)
    }

    const charCountPercentage = maxCharacters 
      ? Math.round((charCount / maxCharacters) * 100) 
      : 0

    const charCountStatus = maxCharacters && charCount > maxCharacters ? 'text-red-600' : 'text-gray-600'

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName || ''}`}>
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Icon (positioned in top-left corner for textarea) */}
          {icon && (
            <div className="absolute left-4 top-3 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Textarea element */}
          <textarea
            ref={ref}
            disabled={disabled || isLoading}
            rows={rows}
            value={value}
            onChange={handleChange}
            className={`${baseTextareaClasses} ${borderClasses} ${icon ? 'pl-10' : ''}`}
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

          {/* Validation icons */}
          {(isValid || error) && (
            <div className="absolute right-4 top-3">
              {isValid && <CheckCircle size={18} className="text-green-500" />}
              {error && <AlertCircle size={18} className="text-red-500" />}
            </div>
          )}
        </div>

        {/* Character counter and helper text */}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex-1">
            {(error || helperText) && (
              <p className={`text-xs ${error ? 'text-red-600' : 'text-gray-600'}`}>
                {error || helperText}
              </p>
            )}
          </div>

          {/* Character count */}
          {showCharCount && (
            <p className={`text-xs ml-2 whitespace-nowrap ${charCountStatus}`}>
              {charCount}
              {maxCharacters && `/${maxCharacters}`}
            </p>
          )}
        </div>

        {/* Character count progress bar */}
        {showCharCount && maxCharacters && charCountPercentage > 0 && (
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-colors duration-150 ${
                charCount > maxCharacters
                  ? 'bg-red-500'
                  : charCountPercentage > 80
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(charCountPercentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
