import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function CashRegisterPanel() {
  const { t } = useTranslation()
  const panelData = useUIStore((s) => s.panelData)
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'withdraw' | 'deposit' | null>(null)

  if (!panelData) return null

  const { balance, job } = panelData

  const handleAction = () => {
    if (!action || !amount || parseInt(amount) <= 0) return
    fetchNui('registerAction', { job, action, amount: parseInt(amount) })
    fetchNui('closeUI')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/30" onClick={() => fetchNui('closeUI')} />
      <div className="relative w-[380px] glass rounded-xl border border-panel-border animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
          <h3 className="text-base font-semibold text-white">{t('cashRegister.title')}</h3>
          <button onClick={() => fetchNui('closeUI')} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Balance */}
          <div className="p-4 rounded-lg bg-panel-accent/10 border border-panel-accent/20 text-center">
            <p className="text-xs text-gray-400 mb-1">{t('cashRegister.balance')}</p>
            <p className="text-2xl font-bold text-white">${typeof balance === 'number' ? balance.toLocaleString() : balance}</p>
          </div>

          {/* Action Buttons */}
          {!action ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setAction('withdraw')}
                className="flex-col gap-1 py-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {t('cashRegister.withdraw')}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setAction('deposit')}
                className="flex-col gap-1 py-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {t('cashRegister.deposit')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                label={t('cashRegister.amount')}
                description={t('cashRegister.amountDesc')}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="md" onClick={() => setAction(null)} className="flex-1">
                  {t('common.back')}
                </Button>
                <Button
                  variant={action === 'withdraw' ? 'primary' : 'secondary'}
                  size="md"
                  onClick={handleAction}
                  className="flex-1"
                  disabled={!amount || parseInt(amount) <= 0}
                >
                  {action === 'withdraw' ? t('cashRegister.withdraw') : t('cashRegister.deposit')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
