import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import type { Job } from '../../types'

export default function PropEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const openEditor = useUIStore((s) => s.openEditor)
  const [showNew, setShowNew] = useState(false)
  const [model, setModel] = useState('')
  const [placing, setPlacing] = useState(false)

  if (!selectedJob) return null
  const props = selectedJob.props || []

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const handlePlace = () => {
    if (!model.trim()) return
    setPlacing(true)
    // Send to Lua — closes NUI, starts ghost-prop placement loop
    fetchNui('requestPropPlacement', { model: model.trim(), job: selectedJob.job })
    // Lua will call back via 'propPlaced' NUI message when done or cancelled
  }

  // Listen for Lua callback after placement
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action === 'propPlaced') {
        setPlacing(false)
        if (e.data.data?.cancelled) {
          setShowNew(false)
          setModel('')
          return
        }
        const { coords, rotation } = e.data.data
        const updated = { ...selectedJob }
        updated.props = [
          ...(selectedJob.props || []),
          {
            id: `prop_${selectedJob.job}_${Date.now()}`,
            model: model.trim(),
            coords,
            rotation,
          }
        ]
        saveJob(updated)
        setShowNew(false)
        setModel('')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [selectedJob, model])

  const handleDelete = (index: number) => {
    const updated = { ...selectedJob }
    updated.props = props.filter((_, i) => i !== index)
    saveJob(updated)
  }

  return (
    <div className="fixed left-[296px] top-4 bottom-4 w-[380px] glass rounded-xl border border-panel-border animate-scale-in z-30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <button onClick={() => openEditor('featureEditor')} className="p-1 rounded hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-semibold text-white">{t('propEditor.title')}</h3>
          <span className="ml-auto text-xs text-gray-500">{props.length} {t('propEditor.props')}</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {props.map((prop, index) => (
          <div key={prop.id} className="flex items-center gap-3 p-3 rounded-lg border border-panel-border/60 card-gradient group">
            {/* Cube icon */}
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{prop.model}</p>
              <p className="text-[10px] text-gray-500">
                {prop.coords.x.toFixed(1)}, {prop.coords.y.toFixed(1)}, {prop.coords.z.toFixed(1)}
                {' · '}Z: {prop.rotation.z.toFixed(1)}°
              </p>
            </div>
            <button
              onClick={() => handleDelete(index)}
              className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-panel-error/20 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-panel-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {/* New prop form */}
        {showNew ? (
          <div className="p-3 rounded-lg border border-panel-accent/30 glass flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('propEditor.model')}</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="prop_bench_01a"
                className="w-full h-9 px-3 rounded-lg bg-white/5 border border-panel-border/60 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-panel-accent/40 transition-colors"
                autoComplete="off"
                disabled={placing}
              />
              <p className="text-[10px] text-gray-600 mt-1">{t('propEditor.modelHint')}</p>
            </div>

            {placing ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <svg className="w-4 h-4 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-orange-300">{t('propEditor.placing')}</p>
                  <p className="text-[10px] text-orange-400/70">{t('propEditor.placingHint')}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowNew(false); setModel('') }} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" size="sm" onClick={handlePlace} className="flex-1" disabled={!model.trim()}>
                  {t('propEditor.place')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowNew(true)} className="w-full">
            + {t('propEditor.newProp')}
          </Button>
        )}
      </div>
    </div>
  )
}
