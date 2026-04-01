import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import { PED_MODELS } from '../../data/pedModels'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Job } from '../../types'

export default function PedEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const openEditor = useUIStore((s) => s.openEditor)
  const [showNew, setShowNew] = useState(false)
  const [newPed, setNewPed] = useState({ label: '', model: '', animAnim: '', animDict: '' })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!selectedJob) return null

  const peds = selectedJob.peds || []

  const suggestions = useMemo(() => {
    if (!newPed.model || newPed.model.length < 1) return []
    const q = newPed.model.toLowerCase()
    return PED_MODELS.filter((m) => m.includes(q)).slice(0, 20)
  }, [newPed.model])

  useEffect(() => {
    setSelectedSuggestion(-1)
  }, [newPed.model])

  // Scroll selected into view
  useEffect(() => {
    if (selectedSuggestion >= 0 && suggestionsRef.current) {
      const el = suggestionsRef.current.children[selectedSuggestion] as HTMLElement
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedSuggestion])

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const handleCreate = () => {
    fetchNui('getPlayerPosition').then((result: any) => {
      if (result) {
        const updated = { ...selectedJob }
        updated.peds = [...peds, {
          label: newPed.label || 'NPC',
          model: newPed.model,
          coords: result.coords,
          heading: result.heading,
          animAnim: newPed.animAnim || undefined,
          animDict: newPed.animDict || undefined,
        }]
        saveJob(updated)
        setShowNew(false)
        setNewPed({ label: '', model: '', animAnim: '', animDict: '' })
      }
    })
  }

  const handleDelete = (index: number) => {
    const updated = { ...selectedJob }
    updated.peds = peds.filter((_, i) => i !== index)
    saveJob(updated)
  }

  const handleModelChange = (value: string) => {
    setNewPed({ ...newPed, model: value })
    setShowSuggestions(true)
  }

  const handleSelectSuggestion = (model: string) => {
    setNewPed({ ...newPed, model })
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault()
      handleSelectSuggestion(suggestions[selectedSuggestion])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="fixed left-[296px] top-4 bottom-4 w-[380px] glass rounded-xl border border-panel-border animate-scale-in z-30 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditor('featureEditor')}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-semibold text-white">{t('pedEditor.title')}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {peds.map((ped, index) => (
          <div key={index} className="p-3 rounded-lg border border-panel-border glass">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-200">{ped.label}</p>
              <button
                onClick={() => handleDelete(index)}
                className="p-1 rounded hover:bg-panel-error/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-panel-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              {ped.model}
              {ped.animDict && ped.animAnim ? ` · ${ped.animDict}/${ped.animAnim}` : ''}
            </p>
          </div>
        ))}

        {showNew ? (
          <div className="p-3 rounded-lg border border-panel-accent/30 glass flex flex-col gap-3">
            <Input
              label={t('pedEditor.label')}
              value={newPed.label}
              onChange={(e) => setNewPed({ ...newPed, label: e.target.value })}
              placeholder="Cashier"
            />

            {/* Model input with autocomplete */}
            <div className="relative">
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('pedEditor.model')}</label>
              <input
                ref={inputRef}
                type="text"
                value={newPed.model}
                onChange={(e) => handleModelChange(e.target.value)}
                onFocus={() => newPed.model && setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="s_f_y_sweatshop_01"
                className="w-full h-9 px-3 rounded-lg bg-white/5 border border-panel-border/60 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-panel-accent/40 transition-colors"
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-full mt-1 max-h-[180px] overflow-y-auto rounded-lg border border-panel-border/80 bg-[#1a1a2e] z-50"
                >
                  {suggestions.map((model, idx) => {
                    // Highlight matching part
                    const q = newPed.model.toLowerCase()
                    const matchIdx = model.indexOf(q)
                    const before = model.slice(0, matchIdx)
                    const match = model.slice(matchIdx, matchIdx + q.length)
                    const after = model.slice(matchIdx + q.length)

                    return (
                      <button
                        key={model}
                        onClick={() => handleSelectSuggestion(model)}
                        onMouseEnter={() => setSelectedSuggestion(idx)}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          idx === selectedSuggestion
                            ? 'bg-panel-accent/15 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                      >
                        {before}
                        <span className="text-pink-400 font-medium">{match}</span>
                        {after}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <Input
              label={t('pedEditor.animation')}
              value={newPed.animAnim}
              onChange={(e) => setNewPed({ ...newPed, animAnim: e.target.value })}
              placeholder="WORLD_HUMAN_CLIPBOARD"
            />
            <Input
              label={t('pedEditor.animDict')}
              value={newPed.animDict}
              onChange={(e) => setNewPed({ ...newPed, animDict: e.target.value })}
              placeholder="missfbi3_party_d"
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreate} className="flex-1" disabled={!newPed.label || !newPed.model}>
                {t('common.create')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowNew(true)} className="w-full">
            + {t('pedEditor.newPed')}
          </Button>
        )}
      </div>
    </div>
  )
}
