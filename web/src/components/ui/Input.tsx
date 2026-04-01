import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
}

export default function Input({
  label,
  description,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-200">{label}</label>
      )}
      {description && (
        <span className="text-xs text-gray-400">{description}</span>
      )}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-panel-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-panel-accent focus:ring-1 focus:ring-panel-accent/50 transition-colors ${error ? 'border-panel-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-panel-error">{error}</span>}
    </div>
  )
}
