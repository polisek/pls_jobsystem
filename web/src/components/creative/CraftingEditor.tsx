import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ItemSidebar from './ItemSidebar'
import type { Job, Item } from '../../types'

type SelectionMode =
  | null
  | { type: 'recipe' }
  | { type: 'ingredient'; recipeIdx: number }

export default function CraftingEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const items = useJobStore((s) => s.items)
  const openEditor = useUIStore((s) => s.openEditor)
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(null)
  const [newTableLabel, setNewTableLabel] = useState('')
  const [showNewTable, setShowNewTable] = useState(false)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null)

  if (!selectedJob) return null

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const handleNewTable = () => {
    fetchNui('requestRaycast').then((result: any) => {
      if (result?.coords) {
        const updated = { ...selectedJob }
        const id = `${selectedJob.job}${selectedJob.craftings.length}_${Math.floor(Math.random() * 9999)}`
        updated.craftings = [...updated.craftings, {
          id,
          label: newTableLabel || 'Crafting Table',
          coords: result.coords,
          items: [],
        }]
        saveJob(updated)
        setNewTableLabel('')
        setShowNewTable(false)
      }
    })
  }

  const handleDeleteTable = (index: number) => {
    const updated = { ...selectedJob }
    updated.craftings = selectedJob.craftings.filter((_, i) => i !== index)
    saveJob(updated)
    setSelectedTableIndex(null)
    setSelectionMode(null)
  }

  const handleChangePosition = (index: number) => {
    fetchNui('requestRaycast').then((result: any) => {
      if (result?.coords) {
        const updated = { ...selectedJob }
        updated.craftings = updated.craftings.map((ct, i) =>
          i === index ? { ...ct, coords: result.coords } : ct
        )
        saveJob(updated)
      }
    })
  }

  const handleUpdateCount = (tableIdx: number, recipeIdx: number, count: number) => {
    const updated = { ...selectedJob }
    updated.craftings = updated.craftings.map((ct, ti) =>
      ti === tableIdx
        ? { ...ct, items: ct.items.map((r, ri) => ri === recipeIdx ? { ...r, itemCount: count } : r) }
        : ct
    )
    saveJob(updated)
  }

  const handleUpdateIngredientCount = (tableIdx: number, recipeIdx: number, ingIdx: number, count: number) => {
    const updated = { ...selectedJob }
    updated.craftings = updated.craftings.map((ct, ti) =>
      ti === tableIdx
        ? {
          ...ct, items: ct.items.map((r, ri) =>
            ri === recipeIdx
              ? { ...r, ingedience: r.ingedience.map((ing, ii) => ii === ingIdx ? { ...ing, itemCount: count } : ing) }
              : r
          )
        }
        : ct
    )
    saveJob(updated)
  }

  const handleDeleteRecipe = (tableIdx: number, recipeIdx: number) => {
    const updated = { ...selectedJob }
    updated.craftings = updated.craftings.map((ct, ti) =>
      ti === tableIdx
        ? { ...ct, items: ct.items.filter((_, ri) => ri !== recipeIdx) }
        : ct
    )
    saveJob(updated)
    if (selectionMode?.type === 'ingredient' && selectionMode.recipeIdx === recipeIdx) {
      setSelectionMode(null)
    }
  }

  const handleDeleteIngredient = (tableIdx: number, recipeIdx: number, ingIdx: number) => {
    const updated = { ...selectedJob }
    updated.craftings = updated.craftings.map((ct, ti) =>
      ti === tableIdx
        ? {
          ...ct, items: ct.items.map((r, ri) =>
            ri === recipeIdx
              ? { ...r, ingedience: r.ingedience.filter((_, ii) => ii !== ingIdx) }
              : r
          )
        }
        : ct
    )
    saveJob(updated)
  }

  const handleSetAnimation = (tableIdx: number, recipeIdx: number, anim: string, dict: string) => {
    const updated = { ...selectedJob }
    updated.craftings = updated.craftings.map((ct, ti) =>
      ti === tableIdx
        ? {
          ...ct, items: ct.items.map((r, ri) =>
            ri === recipeIdx
              ? { ...r, animation: (anim && dict) ? { anim, dict } : undefined }
              : r
          )
        }
        : ct
    )
    saveJob(updated)
  }

  // --- Click-based item selection ---

  const handleItemClick = (item: Item) => {
    if (!selectionMode || selectedTableIndex === null) return

    if (selectionMode.type === 'recipe') {
      const updated = { ...selectedJob }
      updated.craftings = selectedJob.craftings.map((ct, i) =>
        i === selectedTableIndex
          ? { ...ct, items: [...ct.items, { itemName: item.name, itemCount: 1, ingedience: [] }] }
          : ct
      )
      saveJob(updated)
      setSelectionMode(null)
    } else if (selectionMode.type === 'ingredient') {
      const recipe = selectedJob.craftings[selectedTableIndex].items[selectionMode.recipeIdx]
      if (recipe.ingedience.some(ing => ing.itemName === item.name)) return
      const updated = { ...selectedJob }
      updated.craftings = selectedJob.craftings.map((ct, i) =>
        i === selectedTableIndex
          ? {
            ...ct, items: ct.items.map((r, ri) =>
              ri === selectionMode.recipeIdx
                ? { ...r, ingedience: [...r.ingedience, { itemName: item.name, itemCount: 1 }] }
                : r
            )
          }
          : ct
      )
      saveJob(updated)
    }
  }

  const toggleRecipeMode = () => {
    setSelectionMode(selectionMode?.type === 'recipe' ? null : { type: 'recipe' })
  }

  const toggleIngredientMode = (recipeIdx: number) => {
    setSelectionMode(
      selectionMode?.type === 'ingredient' && selectionMode.recipeIdx === recipeIdx
        ? null
        : { type: 'ingredient', recipeIdx }
    )
  }

  const getItemLabel = (name: string) => items.find((i) => i.name === name)?.label || name
  const selectedTable = selectedTableIndex !== null ? selectedJob.craftings[selectedTableIndex] : null
  const imageDir = useJobStore.getState().imageDir

  return (
    <>
      <div className="fixed left-[296px] top-4 bottom-4 w-[440px] glass-card animate-scale-in z-30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedTable) {
                  setSelectedTableIndex(null)
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
                {selectedTable ? selectedTable.label : t('craftingEditor.title')}
              </h3>
              {selectedTable && (
                <p className="text-[10px] text-gray-500 mt-0.5">{selectedTable.id}</p>
              )}
            </div>
          </div>
          {selectedTable && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-panel-accent/10 text-panel-accent border border-panel-accent/20 font-medium">
              {selectedTable.items.length} {t('craftingEditor.recipes').toLowerCase()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!selectedTable ? (
            /* ─── TABLE LIST ─── */
            <>
              <div className="section-label">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {t('craftingEditor.tables')}
              </div>

              {selectedJob.craftings.map((table, index) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableIndex(index)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg card-gradient border border-panel-border/60 hover:border-panel-accent/20 hover:bg-white/[0.03] transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:bg-indigo-500/15 transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.658 3.163 1.08-6.305L2.172 7.6l6.335-.92L11.42 1.1l2.912 5.58 6.335.92-4.67 4.428 1.08 6.305z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">{table.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{table.items.length} {t('craftingEditor.recipes').toLowerCase()}</p>
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

              {showNewTable ? (
                <div className="p-3.5 rounded-lg border border-panel-accent/20 card-gradient flex flex-col gap-3">
                  <Input
                    placeholder={t('craftingEditor.tableLabel')}
                    value={newTableLabel}
                    onChange={(e) => setNewTableLabel(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewTable(false)} className="flex-1">
                      {t('common.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleNewTable} className="flex-1" disabled={!newTableLabel}>
                      {t('craftingEditor.newTable')}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTable(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-panel-border/50 hover:border-panel-accent/30 text-gray-500 hover:text-panel-accent transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium">{t('craftingEditor.newTable')}</span>
                </button>
              )}
            </>
          ) : (
            /* ─── RECIPES VIEW ─── */
            <>
              {selectedTable.items.length > 0 && (
                <div className="section-label">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t('craftingEditor.recipes')}
                </div>
              )}

              {selectedTable.items.map((recipe, recipeIdx) => {
                const isIngredientMode = selectionMode?.type === 'ingredient' && selectionMode.recipeIdx === recipeIdx

                return (
                  <div key={recipeIdx} className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isIngredientMode
                      ? 'border-panel-accent/40'
                      : 'border-panel-border/60'
                  }`}>
                    {/* ── Recipe header ── */}
                    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isIngredientMode ? 'bg-panel-accent/5' : 'card-gradient'
                    }`}>
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5">
                        <img
                          src={`${imageDir}${recipe.itemName}.png`}
                          alt={recipe.itemName}
                          className="w-8 h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-100 truncate">{getItemLabel(recipe.itemName)}</p>
                        <p className="text-[10px] text-gray-500">{recipe.itemName}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1">
                          <span className="text-[10px] text-gray-500">×</span>
                          <input
                            type="number"
                            value={recipe.itemCount}
                            onChange={(e) => handleUpdateCount(selectedTableIndex!, recipeIdx, parseInt(e.target.value) || 1)}
                            className="w-10 bg-transparent text-xs text-white text-center focus:outline-none"
                            min={1}
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteRecipe(selectedTableIndex!, recipeIdx)}
                          className="w-7 h-7 rounded-md hover:bg-panel-error/15 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-500 hover:text-panel-error transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* ── Ingredients ── */}
                    <div className="px-4 py-2.5 bg-black/10 border-t border-white/[0.03]">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium mb-2">{t('craftingEditor.ingredients')}</p>

                      {recipe.ingedience.length > 0 && (
                        <div className="flex flex-col gap-1 mb-2">
                          {recipe.ingedience.map((ing, ingIdx) => (
                            <div key={ingIdx} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-white/[0.03] group/ing transition-colors">
                              <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img
                                  src={`${imageDir}${ing.itemName}.png`}
                                  alt={ing.itemName}
                                  className="w-5 h-5 object-contain"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              </div>
                              <span className="text-xs text-gray-300 flex-1 truncate">{getItemLabel(ing.itemName)}</span>
                              <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5">
                                <span className="text-[10px] text-gray-500">×</span>
                                <input
                                  type="number"
                                  value={ing.itemCount}
                                  onChange={(e) => handleUpdateIngredientCount(selectedTableIndex!, recipeIdx, ingIdx, parseInt(e.target.value) || 1)}
                                  className="w-8 bg-transparent text-[11px] text-white text-center focus:outline-none"
                                  min={1}
                                />
                              </div>
                              <button
                                onClick={() => handleDeleteIngredient(selectedTableIndex!, recipeIdx, ingIdx)}
                                className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/ing:opacity-100 hover:bg-panel-error/20 transition-all"
                              >
                                <svg className="w-3 h-3 text-panel-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add ingredient button */}
                      <button
                        onClick={() => toggleIngredientMode(recipeIdx)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all duration-200 ${
                          isIngredientMode
                            ? 'border-panel-accent/50 bg-panel-accent/10 text-panel-accent'
                            : 'border-dashed border-white/10 text-gray-600 hover:border-white/20 hover:text-gray-400'
                        }`}
                      >
                        {isIngredientMode ? (
                          <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                        <span className="text-[10px] font-medium">
                          {isIngredientMode ? t('craftingEditor.selectingIngredient') : t('craftingEditor.addIngredient')}
                        </span>
                      </button>
                    </div>

                    {/* Animation badge */}
                    {recipe.animation && (
                      <div className="px-4 py-2 bg-black/5 border-t border-white/[0.03] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          <span className="text-[10px] text-gray-500">{recipe.animation.dict}/{recipe.animation.anim}</span>
                        </div>
                        <button
                          onClick={() => handleSetAnimation(selectedTableIndex!, recipeIdx, '', '')}
                          className="text-[10px] text-panel-error hover:underline"
                        >
                          {t('craftingEditor.clearAnimation')}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* ── Add new recipe button ── */}
              <button
                onClick={toggleRecipeMode}
                className={`flex flex-col items-center justify-center py-7 rounded-xl border-2 border-dashed transition-all duration-200 ${
                  selectionMode?.type === 'recipe'
                    ? 'border-panel-accent/50 bg-panel-accent/5'
                    : 'border-panel-border/30 hover:border-panel-accent/20 hover:bg-white/[0.02]'
                }`}
              >
                {selectionMode?.type === 'recipe' ? (
                  <svg className="w-7 h-7 mb-2 text-panel-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <span className={`text-xs font-medium transition-colors ${selectionMode?.type === 'recipe' ? 'text-panel-accent' : 'text-gray-500'}`}>
                  {selectionMode?.type === 'recipe' ? t('craftingEditor.selectingRecipe') : t('craftingEditor.addRecipe')}
                </span>
                <span className={`text-[10px] mt-0.5 transition-colors ${selectionMode?.type === 'recipe' ? 'text-panel-accent/60' : 'text-gray-600'}`}>
                  {selectionMode?.type === 'recipe' ? t('craftingEditor.clickItemHint') : t('craftingEditor.clickToActivate')}
                </span>
              </button>

              {/* Delete table */}
              <div className="pt-2 mt-auto border-t border-panel-border/40">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDeleteTable(selectedTableIndex!)}
                >
                  {t('craftingEditor.deleteTable')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Item Sidebar */}
      <ItemSidebar
        open={selectedTable !== null}
        onItemClick={handleItemClick}
        selectionActive={selectionMode !== null}
      />
    </>
  )
}
