import { useEffect, useRef } from 'react'

const resourceName = (window as any).GetParentResourceName
  ? (window as any).GetParentResourceName()
  : 'pls_jobsystem'

export function fetchNui<T = any>(event: string, data: any = {}): Promise<T> {
  return fetch(`https://${resourceName}/${event}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((resp) => resp.json())
    .catch(() => ({}))
}

// Use ref-based approach to avoid re-registering listeners when handler changes
export function useNuiEvent<T = any>(
  action: string,
  handler: (data: T) => void
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const { action: eventAction, data } = event.data
      if (eventAction === action) {
        handlerRef.current(data)
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [action]) // Only re-register if action name changes (never in practice)
}

export function isEnvBrowser(): boolean {
  return !(window as any).invokeNative
}
