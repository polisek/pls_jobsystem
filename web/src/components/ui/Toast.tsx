import React from 'react'
import { useUIStore } from '../../store/uiStore'

const typeStyles = {
  success: 'border-panel-success/40 bg-panel-success/10',
  error: 'border-panel-error/40 bg-panel-error/10',
  inform: 'border-panel-accent/40 bg-panel-accent/10',
}

const typeIcons = {
  success: (
    <svg className="w-4 h-4 text-panel-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-panel-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  inform: (
    <svg className="w-4 h-4 text-panel-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-slide-in-right rounded-lg border px-4 py-3 min-w-[280px] max-w-[360px] cursor-pointer ${typeStyles[toast.type]}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0">{typeIcons[toast.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{toast.title}</p>
              <p className="text-xs text-gray-300 mt-0.5">{toast.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
