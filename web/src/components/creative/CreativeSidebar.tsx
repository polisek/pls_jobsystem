import React from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'

export default function CreativeSidebar() {
  const { t } = useTranslation()
  const jobs = useJobStore((s) => s.jobs)
  const selectedJob = useJobStore((s) => s.selectedJob)
  const setSelectedJob = useJobStore((s) => s.setSelectedJob)
  const openEditor = useUIStore((s) => s.openEditor)
  const editorPanel = useUIStore((s) => s.editorPanel)

  const handleSelectJob = (job: typeof jobs[0]) => {
    setSelectedJob(job)
    openEditor('featureEditor')
  }

  const handleNewJob = () => {
    setSelectedJob(null)
    openEditor('jobCreator')
  }

  const handlePull = (type: string) => {
    fetchNui('pullChanges', { type })
  }

  const handleBackup = () => {
    fetchNui('createBackup')
  }

  const handleRestore = () => {
    openEditor(null)
    useUIStore.getState().openPanel('confirm', {
      header: t('confirm.restoreWarning'),
      onConfirm: () => {
        fetchNui('restoreBackup')
        useUIStore.getState().closePanel()
      },
    })
  }

  return (
    <div className="fixed left-0 top-0 h-full w-[280px] glass border-r border-panel-border animate-slide-in-left flex flex-col z-40">
      {/* Header */}
      <div className="px-4 py-4 border-b border-panel-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-panel-accent animate-pulse" />
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                {t('creative.title')}
              </h2>
              <p className="text-[10px] text-panel-accent/60 font-medium tracking-widest uppercase mt-0.5">
                by PLS SCRIPTS
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchNui('closeUI')}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Job Button */}
      <div className="px-4 py-3 border-b border-panel-border">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={handleNewJob}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          {t('creative.newJob')}
        </Button>
      </div>

      {/* Job List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {t('creative.jobs')}
          </span>
        </div>
        {jobs.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-500">
            {t('creative.noJobs')}
          </div>
        ) : (
          <div className="px-2 pb-2 flex flex-col gap-0.5">
            {jobs.map((job, index) => (
              <button
                key={`${job.job}_${index}`}
                onClick={() => handleSelectJob(job)}
                className={`w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                  selectedJob?.job === job.job
                    ? 'bg-panel-accent/15 border border-panel-accent/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      selectedJob?.job === job.job ? 'text-panel-accent-hover' : 'text-gray-200'
                    }`}>
                      {job.label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {job.job} &middot; {job.craftings.length} craftings
                    </p>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                      selectedJob?.job === job.job ? 'text-panel-accent rotate-90' : 'text-gray-600 group-hover:text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-3 border-t border-panel-border flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => handlePull('creator')}>
            {t('creative.pullMe')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePull('all')}>
            {t('creative.pullAll')}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleBackup}>
            {t('creative.backup')}
          </Button>
          <Button variant="danger" size="sm" onClick={handleRestore}>
            {t('creative.restore')}
          </Button>
        </div>
      </div>
    </div>
  )
}
