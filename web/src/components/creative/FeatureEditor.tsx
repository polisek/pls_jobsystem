import React from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Job } from '../../types'

export default function FeatureEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const openEditor = useUIStore((s) => s.openEditor)
  const [renameValue, setRenameValue] = React.useState(selectedJob?.label || '')
  const [areaValue, setAreaValue] = React.useState(selectedJob?.area || 50)

  if (!selectedJob) return null

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const handleRename = () => {
    if (renameValue && renameValue !== selectedJob.label) {
      saveJob({ ...selectedJob, label: renameValue })
    }
  }

  const handleAreaChange = () => {
    if (areaValue >= 10 && areaValue !== selectedJob.area) {
      saveJob({ ...selectedJob, area: areaValue })
    }
  }

  const handleSetFeature = (feature: 'register' | 'alarm' | 'bossmenu') => {
    if (selectedJob[feature]) {
      const updated = { ...selectedJob }
      updated[feature] = undefined
      saveJob(updated)
    } else {
      fetchNui('requestRaycast').then((result: any) => {
        if (result?.coords) {
          saveJob({ ...selectedJob, [feature]: result.coords })
        }
      })
    }
  }

  const handleDeleteJob = () => {
    useUIStore.getState().openPanel('confirm', {
      header: `${t('jobEditor.deleteJob')}: ${selectedJob.label}`,
      content: t('confirm.deleteWarning'),
      onConfirm: () => {
        fetchNui('deleteJob', { jobData: selectedJob })
        useJobStore.getState().setSelectedJob(null)
        useUIStore.getState().closePanel()
        useUIStore.getState().closeEditor()
      },
    })
  }

  const features: { key: 'register' | 'alarm' | 'bossmenu'; label: string; icon: React.ReactNode; color: string }[] = [
    {
      key: 'register', label: t('jobEditor.cashRegister'), color: 'emerald',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
    },
    {
      key: 'alarm', label: t('jobEditor.alarm'), color: 'amber',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
    },
    {
      key: 'bossmenu', label: t('jobEditor.bossMenu'), color: 'violet',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>,
    },
  ]

  const sections = [
    {
      key: 'craftingEditor' as const,
      label: t('jobEditor.craftings'),
      count: selectedJob.craftings.length,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.658 3.163 1.08-6.305L2.172 7.6l6.335-.92L11.42 1.1l2.912 5.58 6.335.92-4.67 4.428 1.08 6.305z" /></svg>,
      color: 'text-indigo-400',
    },
    {
      key: 'stashEditor' as const,
      label: t('jobEditor.stashes'),
      count: (selectedJob.stashes || []).length,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
      color: 'text-cyan-400',
    },
    {
      key: 'pedEditor' as const,
      label: t('jobEditor.peds'),
      count: (selectedJob.peds || []).length,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
      color: 'text-pink-400',
    },
    {
      key: 'shopEditor' as const,
      label: t('jobEditor.shops'),
      count: (selectedJob.shops || []).length,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75v-2.25a.75.75 0 00-.75-.75h-3.75a.75.75 0 00-.75.75v2.25a.75.75 0 00.75.75z" /></svg>,
      color: 'text-green-400',
    },
  ]

  return (
    <div className="fixed left-[296px] top-4 bottom-4 w-[380px] glass-card animate-scale-in z-30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-panel-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-panel-accent/15 border border-panel-accent/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-panel-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{selectedJob.label}</h3>
            <p className="text-[10px] text-gray-500">{selectedJob.job}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* ─── Settings Section ─── */}
        <div className="flex flex-col gap-3">
          <div className="section-label">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('jobEditor.settings')}
          </div>
          <div className="p-3 rounded-lg card-gradient border border-panel-border/60 flex flex-col gap-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label={t('jobEditor.rename')}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleRename} disabled={!renameValue}>
                {t('common.save')}
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label={t('jobEditor.areaSize')}
                  type="number"
                  value={areaValue.toString()}
                  onChange={(e) => setAreaValue(parseInt(e.target.value) || 0)}
                  min={10}
                  max={100}
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleAreaChange}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Features Section ─── */}
        <div className="flex flex-col gap-3">
          <div className="section-label">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('jobEditor.features')}
          </div>
          <div className="flex flex-col gap-2">
            {features.map((feature) => {
              const isActive = !!selectedJob[feature.key]
              return (
                <div key={feature.key} className={`flex items-center justify-between p-3 rounded-lg card-gradient border transition-all duration-200 ${
                  isActive ? 'border-panel-accent/25' : 'border-panel-border/60'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-panel-accent/15 text-panel-accent' : 'bg-white/5 text-gray-500'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{feature.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-panel-success' : 'bg-gray-600'}`} />
                        <p className={`text-[10px] ${isActive ? 'text-panel-success' : 'text-gray-500'}`}>
                          {isActive ? t('jobEditor.created') : t('jobEditor.notCreated')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={isActive ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => handleSetFeature(feature.key)}
                  >
                    {isActive ? t('jobEditor.removePosition') : t('jobEditor.setPosition')}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Sections ─── */}
        <div className="flex flex-col gap-3">
          <div className="section-label">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Sections
          </div>
          <div className="flex flex-col gap-1.5">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => openEditor(section.key)}
                className="w-full flex items-center gap-3 p-3 rounded-lg card-gradient border border-panel-border/60 hover:border-panel-accent/20 hover:bg-white/[0.03] transition-all duration-200 group"
              >
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${section.color} group-hover:bg-white/10 transition-colors`}>
                  {section.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{section.label}</p>
                  <p className="text-[10px] text-gray-500">{section.count} items</p>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Danger Zone ─── */}
        <div className="pt-2 mt-auto border-t border-panel-border/40">
          <Button variant="danger" size="md" onClick={handleDeleteJob} className="w-full">
            {t('jobEditor.deleteJob')}
          </Button>
        </div>
      </div>
    </div>
  )
}
