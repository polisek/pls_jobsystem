import { create } from 'zustand'
import type { Toast, EditorPanel, PlayerPanel } from '../types'

interface UIStore {
  creativeMode: boolean
  activePanel: PlayerPanel
  panelData: any
  editorPanel: EditorPanel
  raycastPending: boolean
  toasts: Toast[]
  setCreativeMode: (active: boolean) => void
  openPanel: (panel: PlayerPanel, data?: any) => void
  closePanel: () => void
  openEditor: (editor: EditorPanel) => void
  closeEditor: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setRaycastPending: (pending: boolean) => void
}

let toastCounter = 0

export const useUIStore = create<UIStore>((set) => ({
  creativeMode: false,
  activePanel: null,
  panelData: null,
  editorPanel: null,
  raycastPending: false,
  toasts: [],
  setCreativeMode: (active) =>
    set({ creativeMode: active, editorPanel: null, activePanel: null }),
  openPanel: (panel, data = null) => set({ activePanel: panel, panelData: data }),
  closePanel: () => set({ activePanel: null, panelData: null }),
  openEditor: (editor) => set({ editorPanel: editor }),
  closeEditor: () => set({ editorPanel: null }),
  addToast: (toast) => {
    const id = `toast_${++toastCounter}`
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setRaycastPending: (pending) => set({ raycastPending: pending }),
}))
