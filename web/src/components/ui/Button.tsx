import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

const variants = {
  primary:
    'bg-panel-accent hover:bg-panel-accent-hover text-white',
  secondary:
    'glass glass-hover text-gray-200',
  danger:
    'bg-panel-error/20 hover:bg-panel-error/30 text-panel-error border border-panel-error/30',
  ghost:
    'bg-transparent hover:bg-white/5 text-gray-300',
}

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
