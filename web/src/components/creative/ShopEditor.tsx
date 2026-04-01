import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ItemSidebar from './ItemSidebar'
import type { Job, Item } from '../../types'

type SelectionMode = null | { type: 'shopItem' }

export default function ShopEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const items = useJobStore((s) => s.items)
  const openEditor = useUIStore((s) => s.openEditor)
  const [selectedShopIndex, setSelectedShopIndex] = useState<number | null>(null)
  const [newShopLabel, setNewShopLabel] = useState('')
  const [showNewShop, setShowNewShop] = useState(false)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null)

  if (!selectedJob) return null

  const shops = selectedJob.shops || []

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const handleNewShop = () => {
    fetchNui('requestRaycast').then((result: any) => {
      if (result?.coords) {
        const updated = { ...selectedJob }
        const id = `shop_${selectedJob.job}_${(shops.length)}_${Math.floor(Math.random() * 9999)}`
        updated.shops = [...shops, {
          id,
          label: newShopLabel || 'Shop',
          coords: result.coords,
          items: [],
        }]
        saveJob(updated)
        setNewShopLabel('')
        setShowNewShop(false)
      }
    })
  }

  const handleDeleteShop = (index: number) => {
    const updated = { ...selectedJob }
    updated.shops = shops.filter((_, i) => i !== index)
    saveJob(updated)
    setSelectedShopIndex(null)
    setSelectionMode(null)
  }

  const handleChangePosition = (index: number) => {
    fetchNui('requestRaycast').then((result: any) => {
      if (result?.coords) {
        const updated = { ...selectedJob }
        updated.shops = shops.map((s, i) =>
          i === index ? { ...s, coords: result.coords } : s
        )
        saveJob(updated)
      }
    })
  }

  const handleUpdatePrice = (shopIdx: number, itemIdx: number, price: number) => {
    const updated = { ...selectedJob }
    updated.shops = shops.map((s, si) =>
      si === shopIdx
        ? { ...s, items: s.items.map((it, ii) => ii === itemIdx ? { ...it, price } : it) }
        : s
    )
    saveJob(updated)
  }

  const handleDeleteShopItem = (shopIdx: number, itemIdx: number) => {
    const updated = { ...selectedJob }
    updated.shops = shops.map((s, si) =>
      si === shopIdx
        ? { ...s, items: s.items.filter((_, ii) => ii !== itemIdx) }
        : s
    )
    saveJob(updated)
  }

  const handleItemClick = (item: Item) => {
    if (!selectionMode || selectedShopIndex === null) return
    const shop = shops[selectedShopIndex]
    if (shop.items.some(si => si.itemName === item.name)) return
    const updated = { ...selectedJob }
    updated.shops = shops.map((s, i) =>
      i === selectedShopIndex
        ? { ...s, items: [...s.items, { itemName: item.name, price: 100 }] }
        : s
    )
    saveJob(updated)
  }

  const toggleItemMode = () => {
    setSelectionMode(selectionMode?.type === 'shopItem' ? null : { type: 'shopItem' })
  }

  const getItemLabel = (name: string) => items.find((i) => i.name === name)?.label || name
  const selectedShop = selectedShopIndex !== null ? shops[selectedShopIndex] : null
  const imageDir = useJobStore.getState().imageDir

  return (
    <>
      <div className="fixed left-[296px] top-4 bottom-4 w-[440px] glass-card animate-scale-in z-30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedShop) {
                  setSelectedShopIndex(null)
                  setSelectionMode(null)
                } else {
                  openEditor('featureEditor')
                }
              }}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {selectedShop ? selectedShop.label : t('shopEditor.title')}
              </h3>
              {selectedShop && (
                <p className="text-[10px] text-gray-500 mt-0.5">{selectedShop.id}</p>
              )}
            </div>
          </div>
          {selectedShop && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
              {selectedShop.items.length} {t('shopEditor.items').toLowerCase()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!selectedShop ? (
            /* ─── SHOP LIST ─── */
            <>
              <div className="section-label">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {t('shopEditor.shops')}
              </div>

              {shops.map((shop, index) => (
                <button
                  key={shop.id}
                  onClick={() => setSelectedShopIndex(index)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg card-gradient border border-panel-border/60 hover:border-panel-accent/20 hover:bg-white/[0.03] transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0 group-hover:bg-green-500/15 transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75v-2.25a.75.75 0 00-.75-.75h-3.75a.75.75 0 00-.75.75v2.25a.75.75 0 00.75.75z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">{shop.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{shop.items.length} {t('shopEditor.items').toLowerCase()}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleChangePosition(index) }}
                    className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title={t('jobEditor.setPosition')}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              {showNewShop ? (
                <div className="p-3.5 rounded-lg border border-green-500/20 card-gradient flex flex-col gap-3">
                  <Input
                    placeholder={t('shopEditor.shopLabel')}
                    value={newShopLabel}
                    onChange={(e) => setNewShopLabel(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewShop(false)} className="flex-1">
                      {t('common.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleNewShop} className="flex-1" disabled={!newShopLabel}>
                      {t('shopEditor.newShop')}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewShop(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-panel-border/50 hover:border-green-500/30 text-gray-500 hover:text-green-400 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium">{t('shopEditor.newShop')}</span>
                </button>
              )}
            </>
          ) : (
            /* ─── SHOP ITEMS VIEW ─── */
            <>
              {selectedShop.items.length > 0 && (
                <div className="section-label">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {t('shopEditor.items')}
                </div>
              )}

              {selectedShop.items.map((shopItem, itemIdx) => (
                <div key={itemIdx} className="flex items-center gap-3 p-3 rounded-lg card-gradient border border-panel-border/60 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5">
                    <img
                      src={`${imageDir}${shopItem.itemName}.png`}
                      alt={shopItem.itemName}
                      className="w-8 h-8 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{getItemLabel(shopItem.itemName)}</p>
                    <p className="text-[10px] text-gray-500">{shopItem.itemName}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1 flex-shrink-0">
                    <span className="text-[10px] text-green-400">$</span>
                    <input
                      type="number"
                      value={shopItem.price}
                      onChange={(e) => handleUpdatePrice(selectedShopIndex!, itemIdx, parseInt(e.target.value) || 0)}
                      className="w-14 bg-transparent text-xs text-white text-center focus:outline-none"
                      min={0}
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteShopItem(selectedShopIndex!, itemIdx)}
                    className="w-7 h-7 rounded-md hover:bg-panel-error/15 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500 hover:text-panel-error transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add item button */}
              <button
                onClick={toggleItemMode}
                className={`flex flex-col items-center justify-center py-7 rounded-xl border-2 border-dashed transition-all duration-200 ${
                  selectionMode?.type === 'shopItem'
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-panel-border/30 hover:border-green-500/20 hover:bg-white/[0.02]'
                }`}
              >
                {selectionMode?.type === 'shopItem' ? (
                  <svg className="w-7 h-7 mb-2 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <span className={`text-xs font-medium transition-colors ${selectionMode?.type === 'shopItem' ? 'text-green-400' : 'text-gray-500'}`}>
                  {selectionMode?.type === 'shopItem' ? t('shopEditor.selectingItem') : t('shopEditor.addItem')}
                </span>
                <span className={`text-[10px] mt-0.5 transition-colors ${selectionMode?.type === 'shopItem' ? 'text-green-400/60' : 'text-gray-600'}`}>
                  {selectionMode?.type === 'shopItem' ? t('shopEditor.clickItemHint') : t('shopEditor.clickToActivate')}
                </span>
              </button>

              {/* Delete shop */}
              <div className="pt-2 mt-auto border-t border-panel-border/40">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDeleteShop(selectedShopIndex!)}
                >
                  {t('shopEditor.deleteShop')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Item Sidebar */}
      <ItemSidebar
        open={selectedShop !== null}
        onItemClick={handleItemClick}
        selectionActive={selectionMode !== null}
      />
    </>
  )
}
