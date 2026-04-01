import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNuiEvent, fetchNui } from '../../hooks/useNui'
import { useUIStore } from '../../store/uiStore'
import { useJobStore } from '../../store/jobStore'
import type { InteractiveCrafting, ICRecipe } from '../../types'

// ─── types ─────────────────────────────────────────────────
interface SelectionData {
  station: InteractiveCrafting
  recipes: ICRecipe[]
  imageDir?: string
}

interface CraftingState {
  station: InteractiveCrafting
  recipe: ICRecipe
  currentStep: number
  totalSteps: number
}

// ─── component ─────────────────────────────────────────────
export default function InteractiveCraftingPanel() {
  const activePanel = useUIStore((s) => s.activePanel)
  // panelData is stored by App.tsx via openPanel(panel, data) — always up to date
  const panelData = useUIStore((s) => s.panelData) as SelectionData | null
  const items = useJobStore((s) => s.items)
  const imageDir = useJobStore((s) => s.imageDir)

  // Crafting state — set when Lua transitions from selection → crafting
  const [crafting, setCrafting] = useState<CraftingState | null>(null)

  // Lua → React: ingredient check passed, start crafting loop
  useNuiEvent<any>('startICCrafting', (d) => {
    setCrafting({
      station:     d.station,
      recipe:      d.recipe,
      currentStep: d.currentStep,
      totalSteps:  d.totalSteps,
    })
  })

  // Lua → React: step progress update
  useNuiEvent<{ currentStep: number; totalSteps: number }>('updateCraftingStep', (d) => {
    setCrafting(prev => prev ? { ...prev, currentStep: d.currentStep, totalSteps: d.totalSteps } : null)
  })

  if (activePanel !== 'interactiveCrafting' || !panelData) return null

  if (crafting) {
    return <CraftingView data={crafting} />
  }

  return <SelectionView data={panelData} items={items} imageDir={imageDir} />
}

// ─── Selection View ─────────────────────────────────────────
function SelectionView({ data, items, imageDir }: {
  data: SelectionData
  items: { name: string; label: string }[]
  imageDir: string
}) {
  const { t } = useTranslation()
  const { station, recipes } = data
  const imgDir = data.imageDir || imageDir

  const getLabel = (name: string) => items.find(i => i.name === name)?.label || name

  const selectRecipe = (recipe: ICRecipe) => {
    fetchNui('selectICRecipe', { recipeId: recipe.id })
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[460px] z-50 animate-fade-in pointer-events-auto">
      <div className="glass rounded-2xl border border-purple-500/20 flex flex-col overflow-hidden" style={{ maxHeight: '70vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{station.label}</p>
              <p className="text-[10px] text-purple-400/70">{t('icPanel.selectTitle')}</p>
            </div>
          </div>
          <button
            onClick={() => fetchNui('cancelICSelection')}
            className="p-1.5 rounded-lg hover:bg-panel-error/20 transition-colors group"
          >
            <svg className="w-4 h-4 text-gray-500 group-hover:text-panel-error transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Recipe list */}
        <div className="overflow-y-auto p-3 flex flex-col gap-2">
          {recipes.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">{t('icPanel.noRecipes')}</p>
          )}
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => selectRecipe(recipe)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-panel-border/60 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group text-left"
            >
              {/* Result item icon */}
              <div className="w-11 h-11 rounded-lg bg-white/5 border border-panel-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-purple-500/20 transition-colors">
                {recipe.resultItem ? (
                  <img
                    src={`${imgDir}${recipe.resultItem}.png`}
                    className="w-7 h-7 object-contain"
                    onError={e => (e.currentTarget.style.display = 'none')}
                    alt=""
                  />
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 group-hover:text-white truncate">{recipe.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {t('icPanel.result')} <span className="text-gray-300">{recipe.resultItem ? getLabel(recipe.resultItem) : '?'}</span>
                  {recipe.resultCount > 1 && <span className="text-gray-500"> ×{recipe.resultCount}</span>}
                </p>
                {/* Ingredients preview */}
                {recipe.ingredients.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-panel-border/30">
                        <img
                          src={`${imgDir}${ing.itemName}.png`}
                          className="w-3.5 h-3.5 object-contain"
                          onError={e => (e.currentTarget.style.display = 'none')}
                          alt=""
                        />
                        <span className="text-[10px] text-gray-400">{getLabel(ing.itemName)}</span>
                        {ing.itemCount > 1 && <span className="text-[10px] text-gray-600">×{ing.itemCount}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <svg className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-panel-border/20 flex-shrink-0">
          <p className="text-center text-[10px] text-gray-600">{t('icPanel.clickHint')}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Crafting View ──────────────────────────────────────────
function CraftingView({ data }: { data: CraftingState }) {
  const { t } = useTranslation()
  const { station, recipe, currentStep, totalSteps } = data
  const done = currentStep > totalSteps
  const progress = Math.min(currentStep - 1, totalSteps) / Math.max(totalSteps, 1)
  const curIng = recipe.ingredients[currentStep - 1]

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[420px] z-50 animate-fade-in pointer-events-auto">
      <div className="glass rounded-2xl border border-purple-500/20 p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{recipe.label}</p>
              <p className="text-[10px] text-purple-400/70">{station.label} · {t('icPanel.crafting')}</p>
            </div>
          </div>
          {!done && (
            <button
              onClick={() => fetchNui('cancelInteractiveCrafting')}
              className="p-1.5 rounded-lg hover:bg-panel-error/20 transition-colors group"
            >
              <svg className="w-4 h-4 text-gray-500 group-hover:text-panel-error transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{t('icPanel.progress')}</span>
            <span>{Math.min(currentStep - 1, totalSteps)}/{totalSteps}</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 justify-center flex-wrap">
          {recipe.ingredients.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${
              i < currentStep - 1
                ? 'w-2.5 h-2.5 bg-purple-400'
                : i === currentStep - 1
                  ? 'w-3.5 h-3.5 bg-purple-300 ring-4 ring-purple-500/20'
                  : 'w-2 h-2 bg-white/10'
            }`} />
          ))}
        </div>

        {/* Current instruction */}
        {done ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-300">{t('icPanel.done')}</p>
          </div>
        ) : curIng ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
              <span className="text-[10px] text-purple-300 font-bold">{currentStep}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-300">
                {t('icPanel.useItem')} <span className="text-white font-semibold">{curIng.itemName}</span>
                {curIng.itemCount > 1 && <span className="text-gray-500"> ×{curIng.itemCount}</span>}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {t('icPanel.lookHint')} <kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px]">E</kbd>
              </p>
            </div>
          </div>
        ) : null}

        {!done && (
          <p className="text-center text-[10px] text-gray-600">
            <kbd className="px-1 py-0.5 rounded bg-white/5 text-[9px]">X</kbd> {t('icPanel.cancelHint')}
          </p>
        )}
      </div>
    </div>
  )
}
