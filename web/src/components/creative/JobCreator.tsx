import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchNui } from '../../hooks/useNui'
import { useUIStore } from '../../store/uiStore'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function JobCreator() {
  const { t } = useTranslation()
  const closeEditor = useUIStore((s) => s.closeEditor)
  const [form, setForm] = useState({
    label: '',
    jobName: '',
    area: 50,
  })

  const handleCreate = () => {
    if (!form.label || !form.jobName || !form.area) return
    fetchNui('saveNewJob', {
      jobData: {
        label: form.label,
        job: form.jobName,
        area: form.area,
        craftings: [],
      },
    })
    // Auto-pull so the sidebar updates with the new job
    setTimeout(() => fetchNui('pullChanges', { type: 'creator' }), 300)
    closeEditor()
  }

  return (
    <div className="fixed left-[296px] top-[50%] -translate-y-1/2 w-[380px] glass rounded-xl border border-panel-border animate-scale-in z-30">
      <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
        <h3 className="text-base font-semibold text-white">{t('jobCreator.title')}</h3>
        <button onClick={closeEditor} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <Input
          label={t('jobCreator.label')}
          description={t('jobCreator.labelDesc')}
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Burger Shop"
          maxLength={16}
          minLength={4}
        />
        <Input
          label={t('jobCreator.jobName')}
          description={t('jobCreator.jobNameDesc')}
          value={form.jobName}
          onChange={(e) => setForm({ ...form, jobName: e.target.value })}
          placeholder="burgershot"
          maxLength={16}
        />
        <Input
          label={t('jobCreator.area')}
          description={t('jobCreator.areaDesc')}
          type="number"
          value={form.area.toString()}
          onChange={(e) => setForm({ ...form, area: parseInt(e.target.value) || 0 })}
          min={10}
          max={100}
        />

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="md" onClick={closeEditor} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            className="flex-1"
            disabled={!form.label || !form.jobName || form.area < 10}
          >
            {t('jobCreator.create')}
          </Button>
        </div>
      </div>
    </div>
  )
}
