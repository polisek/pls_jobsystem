import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ItemSidebar from './ItemSidebar'
import type { Job, InteractiveCrafting, ICRecipe, ICIngredient, Item } from '../../types'

const ZERO_VEC = { x: 0, y: 0, z: 0 }
const DEFAULT_ING = (): ICIngredient => ({
  itemName: '', itemCount: 1, propModel: '',
  propCoords: { ...ZERO_VEC }, propRotation: { ...ZERO_VEC },
})
const DEFAULT_RECIPE = (stationId: string, idx: number): ICRecipe => ({
  id: `${stationId}_r${idx}_${Math.floor(Math.random() * 9999)}`,
  label: '',
  resultItem: '',
  resultCount: 1,
  resultPropModel: '',
  resultPropRotation: { ...ZERO_VEC },
  ingredients: [],
})

// Migrate old-format station (flat recipe fields) to new format (recipes array)
function migrateStation(st: any): InteractiveCrafting {
  if (Array.isArray(st.recipes)) return st as InteractiveCrafting
  const legacyRecipe: ICRecipe = {
    id: st.id + '_r0',
    label: st.label || 'Recept',
    resultItem: st.resultItem || '',
    resultCount: st.resultCount || 1,
    resultPropModel: st.resultPropModel || '',
    resultPropRotation: st.resultPropRotation || { ...ZERO_VEC },
    ingredients: st.ingredients || [],
  }
  return { id: st.id, label: st.label, coords: st.coords, recipes: [legacyRecipe] }
}

type SelectionMode = null | { type: 'result' } | { type: 'ingredient' }
type Placing = { type: 'result' } | { type: 'ingredient'; idx: number }

export default function InteractiveCraftingEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const items = useJobStore((s) => s.items)
  const imageDir = useJobStore((s) => s.imageDir)
  const openEditor = useUIStore((s) => s.openEditor)

  const [stationIdx, setStationIdx] = useState<number | null>(null)
  const [recipeIdx, setRecipeIdx] = useState<number | null>(null)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null)
  const [placing, setPlacing] = useState<Placing | null>(null)
  const [newStationLabel, setNewStationLabel] = useState('')
  const [showNewStation, setShowNewStation] = useState(false)
  const [newRecipeLabel, setNewRecipeLabel] = useState('')
  const [showNewRecipe, setShowNewRecipe] = useState(false)

  if (!selectedJob) return null

  // Migrate all stations to new format
  const rawStations: any[] = selectedJob.interactiveCraftings || []
  const stations: InteractiveCrafting[] = rawStations.map(migrateStation)

  const station = stationIdx !== null ? stations[stationIdx] : null
  const recipe = station && recipeIdx !== null ? station.recipes[recipeIdx] : null

  // ─── nav level ───
  const level = recipe ? 2 : station ? 1 : 0

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const saveStations = (newStations: InteractiveCrafting[]) => {
    saveJob({ ...selectedJob, interactiveCraftings: newStations })
  }

  const updateStation = (patch: Partial<InteractiveCrafting>) => {
    if (stationIdx === null) return
    const next = stations.map((s, i) => i === stationIdx ? { ...s, ...patch } : s)
    saveStations(next)
  }

  const updateRecipe = (patch: Partial<ICRecipe>) => {
    if (stationIdx === null || recipeIdx === null) return
    const next = stations.map((s, si) => {
      if (si !== stationIdx) return s
      const recipes = s.recipes.map((r, ri) => ri === recipeIdx ? { ...r, ...patch } : r)
      return { ...s, recipes }
    })
    saveStations(next)
  }

  const updateIng = (idx: number, patch: Partial<ICIngredient>) => {
    if (!recipe) return
    updateRecipe({
      ingredients: recipe.ingredients.map((x, i) => i === idx ? { ...x, ...patch } : x),
    })
  }

  const removeIng = (idx: number) => {
    if (!recipe) return
    updateRecipe({ ingredients: recipe.ingredients.filter((_, i) => i !== idx) })
  }

  // prop placement message handler
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action !== 'propPlaced') return
      const data = e.data.data
      if (data.cancelled) { setPlacing(null); return }
      if (stationIdx === null || recipeIdx === null || !placing) return
      const { coords, rotation } = data
      if (placing.type === 'result') {
        updateRecipe({ resultPropRotation: rotation })
      } else if (placing.type === 'ingredient') {
        updateIng(placing.idx, { propCoords: coords, propRotation: rotation })
      }
      setPlacing(null)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [placing, stationIdx, recipeIdx, recipe, station, stations])

  // ─── handlers ───
  const handleNewStation = () => {
    fetchNui('requestRaycast').then((result: any) => {
      if (!result?.coords) return
      const id = `ic_${selectedJob.job}_${stations.length}_${Math.floor(Math.random() * 9999)}`
      saveStations([...stations, {
        id, label: newStationLabel || t('icEditor.defaultStation'), coords: result.coords, recipes: [],
      }])
      setNewStationLabel('')
      setShowNewStation(false)
    })
  }

  const handleDeleteStation = () => {
    if (stationIdx === null) return
    saveStations(stations.filter((_, i) => i !== stationIdx))
    setStationIdx(null)
    setRecipeIdx(null)
    setSelectionMode(null)
  }

  const handleChangeCenterPos = (idx: number) => {
    fetchNui('requestRaycast').then((result: any) => {
      if (!result?.coords) return
      saveStations(stations.map((s, i) => i === idx ? { ...s, coords: result.coords } : s))
    })
  }

  const handleAddRecipe = () => {
    if (!station || stationIdx === null) return
    const newR = DEFAULT_RECIPE(station.id, station.recipes.length)
    newR.label = newRecipeLabel || t('icEditor.defaultRecipe')
    updateStation({ recipes: [...station.recipes, newR] })
    setNewRecipeLabel('')
    setShowNewRecipe(false)
    setRecipeIdx(station.recipes.length)
  }

  const handleDeleteRecipe = () => {
    if (stationIdx === null || recipeIdx === null || !station) return
    updateStation({ recipes: station.recipes.filter((_, i) => i !== recipeIdx) })
    setRecipeIdx(null)
    setSelectionMode(null)
  }

  const handlePlace = (type: Placing) => {
    if (!recipe) return
    const model = type.type === 'result'
      ? recipe.resultPropModel
      : recipe.ingredients[(type as any).idx]?.propModel
    if (!model) return
    setPlacing(type)
    fetchNui('requestPropPlacement', { model, job: selectedJob.job, coords: station?.coords })
  }

  const handleItemClick = (item: Item) => {
    if (!selectionMode || !recipe) return
    if (selectionMode.type === 'result') {
      updateRecipe({ resultItem: item.name })
      setSelectionMode(null)
    } else if (selectionMode.type === 'ingredient') {
      updateRecipe({ ingredients: [...recipe.ingredients, { ...DEFAULT_ING(), itemName: item.name }] })
    }
  }

  const toggleMode = (type: 'result' | 'ingredient') =>
    setSelectionMode(selectionMode?.type === type ? null : { type })

  const getLabel = (name: string) => items.find((i) => i.name === name)?.label || name
  const coordLabel = (c: { x: number; y: number; z: number }) =>
    c.x !== 0 ? `${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.z.toFixed(1)}` : '—'

  const handleBack = () => {
    if (level === 2) { setRecipeIdx(null); setSelectionMode(null) }
    else if (level === 1) { setStationIdx(null); setRecipeIdx(null); setSelectionMode(null) }
    else { openEditor('featureEditor') }
  }

  // ─── header title ───
  const headerTitle =
    level === 2 ? (recipe?.label || t('icEditor.defaultRecipe')) :
    level === 1 ? (station?.label || t('icEditor.defaultStation')) :
    t('icEditor.title')

  const headerSub =
    level === 2 ? `${recipe?.ingredients.length ?? 0} ${t('icEditor.ingredientsUnit')}` :
    level === 1 ? `${station?.recipes.length ?? 0} ${t('icEditor.recipesUnit')}` : null

  return (
    <>
      <div className="fixed left-[296px] top-4 bottom-4 w-[440px] glass rounded-xl border border-panel-border animate-scale-in z-30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-panel-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="text-sm font-semibold text-white">{headerTitle}</h3>
              {headerSub && <p className="text-[10px] text-gray-500 mt-0.5">{headerSub}</p>}
            </div>
          </div>
          {/* breadcrumb */}
          {level > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-600">
              <span className="text-gray-500">{station?.label}</span>
              {level === 2 && <><span>›</span><span className="text-purple-400">{recipe?.label}</span></>}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

          {/* ═══ LEVEL 0: Station list ═══ */}
          {level === 0 && (
            <>
              {stations.map((st, idx) => (
                <button
                  key={st.id}
                  onClick={() => setStationIdx(idx)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg border border-panel-border/60 hover:border-purple-500/20 hover:bg-white/[0.03] transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{st.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{st.recipes.length} {t('icEditor.recipesUnit')}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleChangeCenterPos(idx) }}
                    className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title={t('icEditor.moveCenter')}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </button>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              {showNewStation ? (
                <div className="p-3.5 rounded-lg border border-purple-500/20 bg-white/[0.01] flex flex-col gap-3">
                  <Input placeholder={t('icEditor.stationLabel')} value={newStationLabel} onChange={(e) => setNewStationLabel(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewStation(false)} className="flex-1">{t('common.cancel')}</Button>
                    <Button variant="primary" size="sm" onClick={handleNewStation} className="flex-1" disabled={!newStationLabel}>
                      {t('icEditor.addAndSetCenter')}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewStation(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-panel-border/50 hover:border-purple-500/30 text-gray-500 hover:text-purple-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium">{t('icEditor.newICStation')}</span>
                </button>
              )}
            </>
          )}

          {/* ═══ LEVEL 1: Recipe list ═══ */}
          {level === 1 && station && (
            <>
              {/* Coords */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-panel-border/30">
                <div>
                  <p className="text-[10px] text-gray-500">{t('icEditor.center')}</p>
                  <p className="text-xs font-mono text-gray-300 mt-0.5">{coordLabel(station.coords)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleChangeCenterPos(stationIdx!)}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {t('icEditor.move')}
                </Button>
              </div>
              {/* Edit label */}
              <Input value={station.label} onChange={e => updateStation({ label: e.target.value })} placeholder={t('icEditor.stationLabel')} />

              {/* Recipe list */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-gray-400">{t('icEditor.recipesTitle')}</span>
                <span className="text-[10px] text-gray-600">{station.recipes.length} {t('icEditor.totalCount')}</span>
              </div>

              {station.recipes.map((r, ri) => (
                <button
                  key={r.id}
                  onClick={() => setRecipeIdx(ri)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-panel-border/60 hover:border-purple-500/20 hover:bg-white/[0.03] transition-all group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    {r.resultItem ? (
                      <img src={`${imageDir}${r.resultItem}.png`} className="w-5 h-5 object-contain" onError={e => (e.currentTarget.style.display = 'none')} alt="" />
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{r.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {r.ingredients.length} {t('icEditor.ingredientsUnit')} → {r.resultItem ? getLabel(r.resultItem) : '?'}
                      {r.resultCount > 1 && ` ×${r.resultCount}`}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              {showNewRecipe ? (
                <div className="p-3.5 rounded-lg border border-purple-500/20 bg-white/[0.01] flex flex-col gap-3">
                  <Input placeholder={t('icEditor.recipeLabel')} value={newRecipeLabel} onChange={(e) => setNewRecipeLabel(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewRecipe(false)} className="flex-1">{t('common.cancel')}</Button>
                    <Button variant="primary" size="sm" onClick={handleAddRecipe} className="flex-1" disabled={!newRecipeLabel}>{t('icEditor.addRecipeBtn')}</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewRecipe(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-panel-border/50 hover:border-purple-500/30 text-gray-500 hover:text-purple-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium">{t('icEditor.newRecipe')}</span>
                </button>
              )}

              <div className="pt-2 mt-auto border-t border-panel-border/40">
                <Button variant="danger" size="sm" className="w-full" onClick={handleDeleteStation}>
                  {t('icEditor.deleteStation')}
                </Button>
              </div>
            </>
          )}

          {/* ═══ LEVEL 2: Recipe detail ═══ */}
          {level === 2 && recipe && (
            <>
              {/* Prop placement HUD */}
              {placing && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                  <p className="text-xs text-orange-300">{t('icEditor.placing')}</p>
                </div>
              )}

              {/* Recipe label */}
              <Input value={recipe.label} onChange={e => updateRecipe({ label: e.target.value })} placeholder={t('icEditor.recipeLabel')} />

              {/* Result item */}
              <div className="p-3 bg-white/[0.02] border border-panel-border/30 rounded-lg flex flex-col gap-3">
                <span className="text-xs font-semibold text-gray-300">{t('icEditor.resultProduct')}</span>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => toggleMode('result')}
                    className={`flex-1 min-w-0 h-9 px-3 rounded-lg border text-sm flex items-center gap-2 transition-colors ${selectionMode?.type === 'result' ? 'border-purple-500/50 bg-purple-500/10 text-purple-200' : 'border-panel-border/60 bg-white/5 text-gray-300 hover:bg-white/10'}`}
                  >
                    {recipe.resultItem ? (
                      <>
                        <img src={`${imageDir}${recipe.resultItem}.png`} className="w-5 h-5 object-contain" onError={e => (e.currentTarget.style.display = 'none')} alt="" />
                        <span className="truncate">{getLabel(recipe.resultItem)}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">{t('icEditor.selectItem')}</span>
                    )}
                  </button>
                  <Input
                    type="number" min="1"
                    value={recipe.resultCount}
                    onChange={e => updateRecipe({ resultCount: parseInt(e.target.value) || 1 })}
                    className="w-16 text-center"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <Input
                    placeholder={t('icEditor.propModel')}
                    value={recipe.resultPropModel}
                    onChange={e => updateRecipe({ resultPropModel: e.target.value })}
                    className="text-xs flex-1"
                  />
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handlePlace({ type: 'result' })}
                    disabled={!recipe.resultPropModel || !!placing}
                  >
                    {t('icEditor.placeBtn')}
                  </Button>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">{t('icEditor.propPlacedLabel')}</span>
                  {(recipe.resultPropRotation.z !== 0 || recipe.resultPropRotation.x !== 0)
                    ? <span className="text-green-400 font-medium">{t('icEditor.propPlacedYes')}</span>
                    : <span className="text-orange-400">{t('icEditor.notPlaced')}</span>}
                </div>
              </div>

              {/* Ingredients */}
              <div className="p-3 bg-white/[0.02] border border-panel-border/30 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1 border-b border-panel-border/40">
                  <span className="text-xs font-semibold text-gray-300">{t('icEditor.ingredientsTitle')}</span>
                  <span className="text-[10px] text-gray-600">{recipe.ingredients.length} {t('icEditor.stepsUnit')}</span>
                </div>

                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 flex flex-col gap-2 relative group">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-purple-400 font-bold w-5 text-center flex-shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-panel-border/30">
                        <img src={`${imageDir}${ing.itemName}.png`} className="w-4 h-4 object-contain flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} alt="" />
                        <span className="text-xs text-gray-200 truncate">{getLabel(ing.itemName)}</span>
                      </div>
                      <input
                        type="number" min="1"
                        value={ing.itemCount}
                        onChange={e => updateIng(i, { itemCount: parseInt(e.target.value) || 1 })}
                        className="w-12 h-7 rounded border border-panel-border/60 bg-transparent text-xs text-white text-center focus:outline-none focus:border-purple-500/50 flex-shrink-0"
                      />
                    </div>

                    <div className="flex gap-2 items-center pl-7">
                      <input
                        type="text"
                        placeholder={t('icEditor.propModelInput')}
                        value={ing.propModel}
                        onChange={e => updateIng(i, { propModel: e.target.value })}
                        className="flex-1 h-7 px-2 rounded bg-black/20 border border-panel-border/40 text-[10px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                      />
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handlePlace({ type: 'ingredient', idx: i })}
                        disabled={!ing.propModel || !!placing}
                        className="h-7 px-2 text-[10px] flex-shrink-0"
                      >
                        📍
                      </Button>
                    </div>

                    <button
                      onClick={() => removeIng(i)}
                      className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center border border-red-500/30 hover:bg-red-500/40 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {(ing.propCoords.x !== 0 || ing.propCoords.y !== 0) && (
                      <span className="absolute right-2 bottom-1.5 text-[9px] text-green-400">{t('icEditor.placed')}</span>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => toggleMode('ingredient')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed transition-all duration-200 ${
                    selectionMode?.type === 'ingredient'
                      ? 'border-purple-500/50 bg-purple-500/5 text-purple-400'
                      : 'border-panel-border/30 hover:border-purple-500/20 text-gray-500 hover:text-purple-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium">
                    {selectionMode?.type === 'ingredient'
                      ? `${t('icEditor.selectItemStep')} ${recipe.ingredients.length + 1}`
                      : t('icEditor.addIngredient')}
                  </span>
                </button>
              </div>

              {/* Delete recipe */}
              <div className="pt-2 mt-auto border-t border-panel-border/40">
                <Button variant="danger" size="sm" className="w-full" onClick={handleDeleteRecipe}>
                  {t('icEditor.deleteRecipe')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <ItemSidebar
        open={level === 2}
        onItemClick={handleItemClick}
        selectionActive={selectionMode !== null}
      />
    </>
  )
}
