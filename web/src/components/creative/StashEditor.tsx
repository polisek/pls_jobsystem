import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Job } from '../../types'

export default function StashEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const openEditor = useUIStore((s) => s.openEditor)
  const [showNew, setShowNew] = useState(false)
  const [newStash, setNewStash] = useState({ label: '', slots: 50, weight: 100000, job: true })

  if (!selectedJob) return null

  const stashes = selectedJob.stashes || []

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const handleCreate = () => {
    fetchNui('requestRaycast').then((result: any) => {
      if (result?.coords) {
        const id = `${selectedJob.job}${stashes.length}_${Math.floor(Math.random() * 9999)}`
        const updated = { ...selectedJob }
        updated.stashes = [...stashes, {
          id,
          label: newStash.label || 'Stash',
          coords: result.coords,
          slots: newStash.slots,
          weight: newStash.weight,
          job: newStash.job,
        }]
        saveJob(updated)
        setShowNew(false)
        setNewStash({ label: '', slots: 50, weight: 100000, job: true })
      }
    })
  }

  const handleDelete = (index: number) => {
    const updated = { ...selectedJob }
    updated.stashes = stashes.filter((_, i) => i !== index)
    saveJob(updated)
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
          <h3 className="text-base font-semibold text-white">{t('stashEditor.title')}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {stashes.map((stash, index) => (
          <div key={stash.id} className="p-3 rounded-lg border border-panel-border glass">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-200">{stash.label}</p>
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
              ID: {stash.id} &middot; {stash.slots} slots &middot; {stash.weight}w &middot; {stash.job ? t('stashEditor.yes') : t('stashEditor.no')}
            </p>
          </div>
        ))}

        {showNew ? (
          <div className="p-3 rounded-lg border border-panel-accent/30 glass flex flex-col gap-3">
            <Input
              label={t('stashEditor.label')}
              value={newStash.label}
              onChange={(e) => setNewStash({ ...newStash, label: e.target.value })}
              placeholder="Storage Room"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label={t('stashEditor.slots')}
                type="number"
                value={newStash.slots.toString()}
                onChange={(e) => setNewStash({ ...newStash, slots: parseInt(e.target.value) || 0 })}
              />
              <Input
                label={t('stashEditor.weight')}
                type="number"
                value={newStash.weight.toString()}
                onChange={(e) => setNewStash({ ...newStash, weight: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{t('stashEditor.jobRestricted')}</span>
              <button
                onClick={() => setNewStash({ ...newStash, job: !newStash.job })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  newStash.job
                    ? 'bg-panel-accent/20 text-panel-accent border border-panel-accent/30'
                    : 'bg-white/5 text-gray-400 border border-panel-border'
                }`}
              >
                {newStash.job ? t('stashEditor.yes') : t('stashEditor.no')}
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreate} className="flex-1" disabled={!newStash.label}>
                {t('common.create')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowNew(true)} className="w-full">
            + {t('stashEditor.newStash')}
          </Button>
        )}
      </div>
    </div>
  )
}
