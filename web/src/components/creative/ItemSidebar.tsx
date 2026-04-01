import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import SearchFilter from '../ui/SearchFilter'
import type { Item } from '../../types'

interface ItemSidebarProps {
  open: boolean
  onItemClick?: (item: Item) => void
  selectionActive?: boolean
}

export default function ItemSidebar({ open, onItemClick, selectionActive = false }: ItemSidebarProps) {
  const { t } = useTranslation()
  const items = useJobStore((s) => s.items)
  const imageDir = useJobStore((s) => s.imageDir)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return items
    const lower = search.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower)
    )
  }, [items, search])

  if (!open) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[280px] border-l border-panel-border animate-slide-in-right flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, rgba(15,15,22,0.97) 0%, rgba(12,12,18,0.98) 100%)' }}
    >
      {/* Header */}
      <div className={`px-4 py-4 border-b transition-all duration-300 ${
        selectionActive ? 'border-panel-accent/30 bg-panel-accent/[0.04]' : 'border-panel-border'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
            selectionActive ? 'bg-panel-accent/15 text-panel-accent' : 'bg-white/5 text-gray-500'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xs font-semibold text-white tracking-wide uppercase">
            {t('itemSidebar.title')}
          </h2>
        </div>
        <p className={`text-[10px] mt-2 pl-8 transition-colors ${selectionActive ? 'text-panel-accent' : 'text-gray-600'}`}>
          {selectionActive ? t('itemSidebar.clickToAdd') : t('itemSidebar.hint')}
        </p>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-panel-border">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder={t('itemSelector.search')}
        />
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-8 h-8 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-xs text-gray-600">{t('itemSelector.noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filtered.map((item) => (
              <button
                key={item.name}
                onClick={() => onItemClick?.(item)}
                disabled={!selectionActive}
                className={`flex flex-col items-center p-1.5 rounded-lg border transition-all duration-150 group select-none ${
                  selectionActive
                    ? 'border-transparent hover:border-panel-accent/30 hover:bg-panel-accent/[0.08] cursor-pointer active:scale-95'
                    : 'border-transparent opacity-40 cursor-default'
                }`}
                title={`${item.label} (${item.name})`}
              >
                <div className={`w-[52px] h-[52px] rounded-lg flex items-center justify-center mb-1 transition-all overflow-hidden border ${
                  selectionActive
                    ? 'bg-white/[0.04] border-white/[0.06] group-hover:bg-panel-accent/10 group-hover:border-panel-accent/20'
                    : 'bg-white/[0.02] border-transparent'
                }`}>
                  <img
                    src={`${imageDir}${item.name}.png`}
                    alt={item.name}
                    className="w-9 h-9 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `<span class="text-[10px] text-gray-600 font-mono">${item.name.substring(0, 4)}</span>`
                      }
                    }}
                  />
                </div>
                <span className={`text-[9px] text-center truncate w-full leading-tight transition-colors ${
                  selectionActive ? 'text-gray-500 group-hover:text-panel-accent-hover' : 'text-gray-700'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-panel-border flex items-center justify-between">
        <p className="text-[10px] text-gray-600">
          {filtered.length} / {items.length}
        </p>
        {selectionActive && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-panel-accent animate-pulse" />
            <span className="text-[10px] text-panel-accent font-medium">{t('itemSidebar.active')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
