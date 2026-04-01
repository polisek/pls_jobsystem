import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import Modal from '../ui/Modal'
import SearchFilter from '../ui/SearchFilter'
import type { Item } from '../../types'

interface ItemSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (item: Item) => void
  multi?: boolean
  onMultiSelect?: (items: Item[]) => void
  selectedItems?: string[]
}

export default function ItemSelector({
  open,
  onClose,
  onSelect,
  multi = false,
  onMultiSelect,
  selectedItems = [],
}: ItemSelectorProps) {
  const { t } = useTranslation()
  const items = useJobStore((s) => s.items)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>(selectedItems)

  const filtered = useMemo(() => {
    if (!search) return items
    const lower = search.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower)
    )
  }, [items, search])

  const toggleItem = (item: Item) => {
    if (multi) {
      setSelected((prev) =>
        prev.includes(item.name)
          ? prev.filter((n) => n !== item.name)
          : [...prev, item.name]
      )
    } else {
      onSelect(item)
      onClose()
    }
  }

  const handleConfirmMulti = () => {
    if (onMultiSelect) {
      const selectedItemObjs = items.filter((i) => selected.includes(i.name))
      onMultiSelect(selectedItemObjs)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('itemSelector.title')} width="max-w-md">
      <div className="flex flex-col gap-3">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder={t('itemSelector.search')}
        />

        {multi && selected.length > 0 && (
          <div className="text-xs text-panel-accent">
            {selected.length} {t('itemSelector.selected')}
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-0.5 -mx-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              {t('itemSelector.noResults')}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.name}
                onClick={() => toggleItem(item)}
                className={`w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center gap-3 ${
                  selected.includes(item.name)
                    ? 'bg-panel-accent/10 text-panel-accent-hover'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                {multi && (
                  <span
                    className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                      selected.includes(item.name)
                        ? 'bg-panel-accent border-panel-accent'
                        : 'border-gray-500'
                    }`}
                  >
                    {selected.includes(item.name) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className="text-[10px] text-gray-500">{item.name}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {multi && (
          <div className="flex gap-2 pt-2 border-t border-panel-border">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleConfirmMulti}
              className="flex-1 py-2 text-sm font-medium text-panel-accent hover:text-panel-accent-hover transition-colors"
              disabled={selected.length === 0}
            >
              {t('common.confirm')} ({selected.length})
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
