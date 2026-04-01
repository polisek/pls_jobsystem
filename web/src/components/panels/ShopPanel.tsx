import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../store/uiStore'
import { useJobStore } from '../../store/jobStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import type { ShopItem } from '../../types'

export default function ShopPanel() {
  const { t } = useTranslation()
  const panelData = useUIStore((s) => s.panelData)
  const items = useJobStore((s) => s.items)

  if (!panelData?.items) return null

  const shopItems: ShopItem[] = panelData.items
  const shopLabel: string = panelData.label || t('shop.title')
  const jobName: string = panelData.job || ''
  const imageDir = panelData.imageDir || 'nui://ox_inventory/web/images/'

  const getItemLabel = (name: string) => items.find((i) => i.name === name)?.label || name

  const handleBuy = (shopItem: ShopItem) => {
    fetchNui('buyShopItem', { item: shopItem, job: jobName })
    fetchNui('closeUI')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/30" onClick={() => fetchNui('closeUI')} />
      <div className="relative w-[480px] max-h-[70vh] glass rounded-xl border border-panel-border animate-scale-in flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75v-2.25a.75.75 0 00-.75-.75h-3.75a.75.75 0 00-.75.75v2.25a.75.75 0 00.75.75z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">{shopLabel}</h3>
          </div>
          <button onClick={() => fetchNui('closeUI')} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {shopItems.map((shopItem, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3.5 rounded-lg border border-panel-border/60 card-gradient hover:border-green-500/20 hover:bg-white/[0.02] transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5">
                <img
                  src={`${imageDir}${shopItem.itemName}.png`}
                  alt={shopItem.itemName}
                  className="w-9 h-9 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                  {getItemLabel(shopItem.itemName)}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-semibold text-green-400">${shopItem.price}</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBuy(shopItem)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {t('shop.buy')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
