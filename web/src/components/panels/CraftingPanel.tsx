import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../store/uiStore'
import { useJobStore } from '../../store/jobStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import type { CraftingItem } from '../../types'

export default function CraftingPanel() {
  const { t } = useTranslation()
  const panelData = useUIStore((s) => s.panelData)
  const closePanel = useUIStore((s) => s.closePanel)
  const items = useJobStore((s) => s.items)

  if (!panelData?.items) return null

  const craftItems: CraftingItem[] = panelData.items
  const imageDir = panelData.imageDir || 'nui://ox_inventory/web/images/'

  const getItemLabel = (name: string) => items.find((i) => i.name === name)?.label || name

  const handleCraft = (recipe: CraftingItem) => {
    fetchNui('craftItem', { craftingData: recipe })
    fetchNui('closeUI')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/30" onClick={() => fetchNui('closeUI')} />
      <div className="relative w-[480px] max-h-[70vh] glass rounded-xl border border-panel-border animate-scale-in flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
          <h3 className="text-base font-semibold text-white">{t('crafting.title')}</h3>
          <button onClick={() => fetchNui('closeUI')} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {craftItems.map((recipe, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-panel-border glass-hover cursor-pointer group"
              onClick={() => handleCraft(recipe)}
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={`${imageDir}${recipe.itemName}.png`}
                  alt={recipe.itemName}
                  className="w-10 h-10 rounded-lg object-contain bg-white/5 p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                    {getItemLabel(recipe.itemName)}
                  </p>
                  <p className="text-[10px] text-gray-500">x{recipe.itemCount}</p>
                </div>
                <Button variant="primary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('crafting.craft')}
                </Button>
              </div>

              <div className="flex flex-col gap-1 pl-1">
                <span className="text-[10px] text-gray-500 uppercase">{t('crafting.required')}</span>
                {recipe.ingedience.map((ing, ingIdx) => (
                  <div key={ingIdx} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="text-xs text-gray-400">
                      {getItemLabel(ing.itemName)} x{ing.itemCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
