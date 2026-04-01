import React, { useState, useRef, useEffect } from 'react'

interface Option {
  label: string
  value: string
}

interface SelectProps {
  label?: string
  description?: string
  options: Option[]
  value?: string | string[]
  onChange: (value: string | string[]) => void
  multi?: boolean
  searchable?: boolean
  placeholder?: string
}

export default function Select({
  label,
  description,
  options,
  value,
  onChange,
  multi = false,
  searchable = false,
  placeholder = 'Select...',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedValues = multi
    ? (value as string[]) || []
    : value
      ? [value as string]
      : []

  const displayText = multi
    ? selectedValues.length > 0
      ? `${selectedValues.length} selected`
      : placeholder
    : options.find((o) => o.value === value)?.label || placeholder

  const toggleValue = (val: string) => {
    if (multi) {
      const arr = selectedValues.includes(val)
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val]
      onChange(arr)
    } else {
      onChange(val)
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && (
        <label className="text-sm font-medium text-gray-200">{label}</label>
      )}
      {description && (
        <span className="text-xs text-gray-400">{description}</span>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-panel-border text-sm text-left text-gray-200 hover:bg-white/8 focus:outline-none focus:border-panel-accent transition-colors flex justify-between items-center"
        >
          <span className={!value || (Array.isArray(value) && value.length === 0) ? 'text-gray-500' : ''}>
            {displayText}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg glass border border-panel-border">
            {searchable && (
              <div className="p-2 border-b border-panel-border">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1.5 rounded bg-white/5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 text-center">No results</div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors flex items-center gap-2 ${
                    selectedValues.includes(option.value)
                      ? 'text-panel-accent bg-panel-accent/10'
                      : 'text-gray-300'
                  }`}
                >
                  {multi && (
                    <span
                      className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                        selectedValues.includes(option.value)
                          ? 'bg-panel-accent border-panel-accent'
                          : 'border-gray-500'
                      }`}
                    >
                      {selectedValues.includes(option.value) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  )}
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
