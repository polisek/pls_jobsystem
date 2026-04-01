import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'

export default function ConfirmDialog() {
  const { t } = useTranslation()
  const panelData = useUIStore((s) => s.panelData)
  const closePanel = useUIStore((s) => s.closePanel)

  if (!panelData) return null

  const { header, content, onConfirm } = panelData

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      fetchNui('confirmAction', { confirmed: true })
    }
    closePanel()
  }

  const handleCancel = () => {
    fetchNui('confirmAction', { confirmed: false })
    closePanel()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
      <div className="relative w-[360px] glass rounded-xl border border-panel-border animate-scale-in">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-panel-warn/10 border border-panel-warn/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-panel-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-2">{header || t('confirm.title')}</h3>
          {content && <p className="text-sm text-gray-400 mb-6">{content}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={handleCancel} className="flex-1">
              {t('confirm.cancel')}
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirm} className="flex-1">
              {t('confirm.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
