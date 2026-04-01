import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNuiEvent, fetchNui, isEnvBrowser } from './hooks/useNui'
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
