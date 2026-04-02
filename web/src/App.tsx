import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNuiEvent, fetchNui, isEnvBrowser } from './hooks/useNui'

const EXPECTED_RESOURCE = 'pls_jobsystem'
const actualResource = (window as any).GetParentResourceName?.() as string | undefined
const IS_RESOURCE_VALID = isEnvBrowser || !actualResource || actualResource === EXPECTED_RESOURCE
import { useJobStore } from './store/jobStore'
import { useUIStore } from './store/uiStore'
import CreativeSidebar from './components/creative/CreativeSidebar'
import JobCreator from './components/creative/JobCreator'
import CraftingEditor from './components/creative/CraftingEditor'
import StashEditor from './components/creative/StashEditor'
import PedEditor from './components/creative/PedEditor'
import ShopEditor from './components/creative/ShopEditor'
import BlipEditor from './components/creative/BlipEditor'
import PropEditor from './components/creative/PropEditor'
import InteractiveCraftingEditor from './components/creative/InteractiveCraftingEditor'
import FeatureEditor from './components/creative/FeatureEditor'
import CraftingPanel from './components/panels/CraftingPanel'
import CashRegisterPanel from './components/panels/CashRegisterPanel'
import ShopPanel from './components/panels/ShopPanel'
import InteractiveCraftingPanel from './components/panels/InteractiveCraftingPanel'
import GizmoPropPanel from './components/panels/GizmoPropPanel'
import ConfirmDialog from './components/panels/ConfirmDialog'
import ToastContainer from './components/ui/Toast'

export default function App() {
  const { i18n } = useTranslation()
  const creativeMode = useUIStore((s) => s.creativeMode)
  const activePanel = useUIStore((s) => s.activePanel)
  const editorPanel = useUIStore((s) => s.editorPanel)
  const setCreativeMode = useUIStore((s) => s.setCreativeMode)
  const openPanel = useUIStore((s) => s.openPanel)
  const closePanel = useUIStore((s) => s.closePanel)
  const addToast = useUIStore((s) => s.addToast)
  const setJobs = useJobStore((s) => s.setJobs)
  const setItems = useJobStore((s) => s.setItems)

  const setImageDir = useJobStore((s) => s.setImageDir)

  // NUI Event: open creative mode
  useNuiEvent('setCreativeMode', useCallback((data: any) => {
    if (data.locale) i18n.changeLanguage(data.locale)
    if (data.jobs) setJobs(data.jobs)
    if (data.items) setItems(data.items)
    if (data.imageDir) setImageDir(data.imageDir)
    setCreativeMode(data.active)
  }, [i18n, setJobs, setItems, setImageDir, setCreativeMode]))

  // NUI Event: open player panel
  useNuiEvent('openPanel', useCallback((data: any) => {
    if (data.locale) i18n.changeLanguage(data.locale)
    if (data.items) setItems(data.items)
    openPanel(data.panel, data.data)
  }, [i18n, setItems, openPanel]))

  // NUI Event: close panel
  useNuiEvent('closePanel', useCallback(() => {
    closePanel()
    setCreativeMode(false)
  }, [closePanel, setCreativeMode]))

  // NUI Event: update jobs
  useNuiEvent('updateJobs', useCallback((data: any) => {
    if (data.jobs) setJobs(data.jobs)
  }, [setJobs]))

  // NUI Event: notification
  useNuiEvent('notify', useCallback((data: any) => {
    addToast({
      title: data.title,
      description: data.description,
      type: data.type || 'inform',
    })
  }, [addToast]))

  // NUI Event: raycast result
  useNuiEvent('setRaycastResult', useCallback(() => {
    useUIStore.getState().setRaycastPending(false)
  }, []))

  // NUI Event: gizmo done — close propGizmo panel (keep creative mode), re-dispatch propPlaced
  useNuiEvent('propPlacedGizmo', useCallback((data: any) => {
    closePanel()
    // Re-dispatch as window message so editor components (PropEditor, ICEditor) can pick it up
    window.postMessage({ action: 'propPlaced', data }, '*')
  }, [closePanel]))

  // ESC key handler — always notify Lua to release NUI focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePanel || creativeMode) {
          fetchNui('closeUI')
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [activePanel, creativeMode])

  if (!IS_RESOURCE_VALID) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-[9999]">
        <div className="glass rounded-2xl border border-red-500/40 p-8 max-w-md w-full mx-4 flex flex-col gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-300 mb-1">Neplatný název resource</h2>
            <p className="text-sm text-gray-400">
              Resource musí být pojmenován{' '}
              <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{EXPECTED_RESOURCE}</span>
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Aktuální název:{' '}
              <span className="font-mono text-red-400">{actualResource ?? '?'}</span>
            </p>
          </div>
          <p className="text-[10px] text-gray-600">by PLS SCRIPTS</p>
        </div>
      </div>
    )
  }

  const hasContent = creativeMode || activePanel

  if (!hasContent) return <ToastContainer />

  return (
    <div className="w-full h-full relative">
      {/* Creative Mode */}
      {creativeMode && (
        <>
          <CreativeSidebar />
          {editorPanel === 'jobCreator' && <JobCreator />}
          {editorPanel === 'featureEditor' && <FeatureEditor />}
          {editorPanel === 'craftingEditor' && <CraftingEditor />}
          {editorPanel === 'stashEditor' && <StashEditor />}
          {editorPanel === 'pedEditor' && <PedEditor />}
          {editorPanel === 'shopEditor' && <ShopEditor />}
          {editorPanel === 'blipEditor' && <BlipEditor />}
          {editorPanel === 'propEditor' && <PropEditor />}
          {editorPanel === 'interactiveCraftingEditor' && <InteractiveCraftingEditor />}
        </>
      )}

      {/* Player Panels */}
      {activePanel === 'crafting' && <CraftingPanel />}
      {activePanel === 'cashRegister' && <CashRegisterPanel />}
      {activePanel === 'shop' && <ShopPanel />}
      {activePanel === 'interactiveCrafting' && <InteractiveCraftingPanel />}
      {activePanel === 'propGizmo' && <GizmoPropPanel />}
      {activePanel === 'confirm' && <ConfirmDialog />}

      {/* Toasts */}
      <ToastContainer />
    </div>
  )
}
