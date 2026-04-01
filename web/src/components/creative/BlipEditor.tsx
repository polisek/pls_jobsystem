import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobStore } from '../../store/jobStore'
import { useUIStore } from '../../store/uiStore'
import { fetchNui } from '../../hooks/useNui'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Job, Blip } from '../../types'

// Nejpoužívanější GTA V blip sprite ikonky
const BLIP_SPRITES = [
  { id: 1,   label: 'Blank / Circle' },
  { id: 2,   label: 'BigCircle' },
  { id: 6,   label: 'Skull' },
  { id: 8,   label: 'Police' },
  { id: 9,   label: 'Police Car' },
  { id: 11,  label: 'Star' },
  { id: 19,  label: 'Garage' },
  { id: 22,  label: 'Drugs' },
  { id: 25,  label: 'Bomb' },
  { id: 26,  label: 'Job' },
  { id: 36,  label: 'Clothes' },
  { id: 40,  label: 'Bar / Beer' },
  { id: 43,  label: 'Hair Salon' },
  { id: 50,  label: 'Dollar / Money' },
  { id: 52,  label: 'Food' },
  { id: 56,  label: 'Tattoo' },
  { id: 57,  label: 'Ammu-Nation' },
  { id: 59,  label: 'Hospital' },
  { id: 60,  label: 'Pickup' },
  { id: 67,  label: 'Golf' },
  { id: 68,  label: 'Deathmatch' },
  { id: 70,  label: 'Bank' },
  { id: 71,  label: 'Store' },
  { id: 72,  label: 'Plane' },
  { id: 73,  label: 'Helicopter' },
  { id: 75,  label: 'Boat' },
  { id: 76,  label: 'Bicycle' },
  { id: 105, label: 'Mechanic / Garage' },
  { id: 110, label: 'Tow Truck' },
  { id: 112, label: 'Bus' },
  { id: 153, label: 'Tree / Nature' },
  { id: 154, label: 'Fishing' },
  { id: 162, label: 'Cinema' },
  { id: 166, label: 'Marijuana' },
  { id: 170, label: 'Hunting' },
  { id: 172, label: 'Mine' },
  { id: 175, label: 'Cart / Market' },
  { id: 207, label: 'Weapon Shop' },
  { id: 208, label: 'Armor Shop' },
  { id: 209, label: 'Diner' },
  { id: 212, label: 'Liquor Store' },
  { id: 225, label: 'Repair / Wrench' },
  { id: 280, label: 'Gas Station' },
  { id: 303, label: 'Package' },
  { id: 326, label: 'Security' },
  { id: 351, label: 'Factory' },
  { id: 354, label: 'Warehouse' },
  { id: 357, label: 'Casino' },
  { id: 408, label: 'Crown' },
  { id: 421, label: 'Coke' },
  { id: 422, label: 'Meth' },
  { id: 423, label: 'Weed' },
  { id: 427, label: 'Bikers' },
  { id: 431, label: 'Biker Clubhouse' },
  { id: 473, label: 'Bunker' },
  { id: 479, label: 'Nightclub' },
  { id: 500, label: 'Diamond Casino' },
  { id: 501, label: 'Casino Chip' },
  { id: 565, label: 'Submarine' },
]

const BLIP_COLORS = [
  { id: 0,  label: 'White',      hex: '#ffffff' },
  { id: 1,  label: 'Red',        hex: '#e8413e' },
  { id: 2,  label: 'Green',      hex: '#3bc44b' },
  { id: 3,  label: 'Blue',       hex: '#2c5aa0' },
  { id: 4,  label: 'White 2',    hex: '#f0f0f0' },
  { id: 5,  label: 'Yellow',     hex: '#f5e642' },
  { id: 6,  label: 'Lt. Red',    hex: '#dd6e6e' },
  { id: 7,  label: 'Violet',     hex: '#97309c' },
  { id: 8,  label: 'Pink',       hex: '#ff78cb' },
  { id: 9,  label: 'Lt. Orange', hex: '#f5a55d' },
  { id: 10, label: 'Lt. Brown',  hex: '#8b714d' },
  { id: 11, label: 'Lt. Green',  hex: '#73d44c' },
  { id: 12, label: 'Lt. Blue',   hex: '#8ab2e8' },
  { id: 13, label: 'Lt. Purple', hex: '#c87eff' },
  { id: 14, label: 'Dark Purple',hex: '#5a0076' },
  { id: 17, label: 'Orange',     hex: '#ff9000' },
  { id: 18, label: 'Lt. Blue 2', hex: '#94cbff' },
  { id: 19, label: 'Dark Blue',  hex: '#002f6c' },
  { id: 20, label: 'Dark Red',   hex: '#8b0000' },
  { id: 21, label: 'Dark Yellow',hex: '#b8a800' },
  { id: 25, label: 'Beige',      hex: '#dfcba7' },
  { id: 27, label: 'Dark Green', hex: '#006400' },
  { id: 29, label: 'Brown',      hex: '#8b4513' },
  { id: 30, label: 'Lt. Yellow', hex: '#fff44f' },
  { id: 31, label: 'Cyan',       hex: '#00ffff' },
  { id: 40, label: 'Gold',       hex: '#ffd700' },
  { id: 42, label: 'Teal',       hex: '#008080' },
  { id: 44, label: 'Magenta',    hex: '#ff00ff' },
  { id: 60, label: 'Deep Red',   hex: '#c0392b' },
]

const DEFAULT_BLIP: Omit<Blip, 'id' | 'coords'> = {
  label: '',
  sprite: 1,
  color: 2,
  scale: 0.8,
  jobOnly: false,
}

export default function BlipEditor() {
  const { t } = useTranslation()
  const selectedJob = useJobStore((s) => s.selectedJob)
  const updateSelectedJob = useJobStore((s) => s.updateSelectedJob)
  const openEditor = useUIStore((s) => s.openEditor)
  const [showNew, setShowNew] = useState(false)
  const [newBlip, setNewBlip] = useState({ ...DEFAULT_BLIP })
  const [activeBlipIdx, setActiveBlipIdx] = useState<number | null>(null)

  if (!selectedJob) return null
  const blips = selectedJob.blips || []

  const saveJob = (job: Job) => {
    updateSelectedJob(() => job)
    fetchNui('saveJob', { jobData: job })
  }

  const handleCreate = () => {
    if (!newBlip.label) return
    fetchNui('getPlayerPosition').then((result: any) => {
      if (result) {
        const updated = { ...selectedJob }
        const blip: Blip = {
          id: `blip_${selectedJob.job}_${Date.now()}`,
          label: newBlip.label,
          coords: result.coords,
          sprite: newBlip.sprite,
          color: newBlip.color,
          scale: newBlip.scale,
          jobOnly: newBlip.jobOnly,
        }
        updated.blips = [...blips, blip]
        saveJob(updated)
        setShowNew(false)
        setNewBlip({ ...DEFAULT_BLIP })
      }
    })
  }

  const handleDelete = (index: number) => {
    const updated = { ...selectedJob }
    updated.blips = blips.filter((_, i) => i !== index)
    if (activeBlipIdx === index) setActiveBlipIdx(null)
    saveJob(updated)
  }

  const handleUpdate = (index: number, field: keyof Blip, value: any) => {
    const updated = { ...selectedJob }
    updated.blips = blips.map((b, i) => i === index ? { ...b, [field]: value } : b)
    saveJob(updated)
  }

  const colorFor = (id: number) => BLIP_COLORS.find(c => c.id === id)?.hex || '#ffffff'
  const spriteFor = (id: number) => BLIP_SPRITES.find(s => s.id === id)?.label || `Sprite ${id}`

  return (
    <div className="fixed left-[296px] top-4 bottom-4 w-[400px] glass rounded-xl border border-panel-border animate-scale-in z-30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <button onClick={() => openEditor('featureEditor')} className="p-1 rounded hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-semibold text-white">{t('blipEditor.title')}</h3>
          <span className="ml-auto text-xs text-gray-500">{blips.length} {t('blipEditor.blips')}</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {blips.map((blip, index) => (
          <div key={blip.id} className="rounded-lg border border-panel-border/60 overflow-hidden">
            {/* Summary row */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setActiveBlipIdx(activeBlipIdx === index ? null : index)}
            >
              {/* Color dot */}
              <div className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10" style={{ backgroundColor: colorFor(blip.color) }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{blip.label}</p>
                <p className="text-[10px] text-gray-500">{spriteFor(blip.sprite)} · {blip.jobOnly ? t('blipEditor.jobOnly') : t('blipEditor.everyone')}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(index) }} className="p-1 rounded hover:bg-panel-error/20 transition-colors">
                <svg className="w-3.5 h-3.5 text-panel-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${activeBlipIdx === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded edit */}
            {activeBlipIdx === index && (
              <div className="px-3 pb-3 pt-1 border-t border-panel-border/40 flex flex-col gap-3 bg-white/[0.01]">
                <Input
                  label={t('blipEditor.label')}
                  value={blip.label}
                  onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                />

                {/* Sprite selector */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('blipEditor.sprite')}</label>
                  <select
                    value={blip.sprite}
                    onChange={(e) => handleUpdate(index, 'sprite', Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg bg-white/5 border border-panel-border/60 text-sm text-white focus:outline-none focus:border-panel-accent/40 transition-colors"
                  >
                    {BLIP_SPRITES.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#1a1a2e]">{s.id} — {s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Color selector */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('blipEditor.color')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {BLIP_COLORS.map(c => (
                      <button
                        key={c.id}
                        title={`${c.label} (${c.id})`}
                        onClick={() => handleUpdate(index, 'color', c.id)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${blip.color === c.id ? 'border-white scale-125' : 'border-transparent hover:border-white/40'}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('blipEditor.scale')}: {blip.scale}</label>
                  <input
                    type="range" min="0.1" max="2.0" step="0.1"
                    value={blip.scale}
                    onChange={(e) => handleUpdate(index, 'scale', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Visibility toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-panel-border/40">
                  <div>
                    <p className="text-xs font-medium text-gray-300">{t('blipEditor.visibility')}</p>
                    <p className="text-[10px] text-gray-500">{blip.jobOnly ? t('blipEditor.jobOnly') : t('blipEditor.everyone')}</p>
                  </div>
                  <button
                    onClick={() => handleUpdate(index, 'jobOnly', !blip.jobOnly)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${blip.jobOnly ? 'bg-indigo-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${blip.jobOnly ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* New blip form */}
        {showNew ? (
          <div className="p-3 rounded-lg border border-panel-accent/30 glass flex flex-col gap-3">
            <Input
              label={t('blipEditor.label')}
              value={newBlip.label}
              onChange={(e) => setNewBlip({ ...newBlip, label: e.target.value })}
              placeholder="Mechanic Shop"
            />

            {/* Sprite */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('blipEditor.sprite')}</label>
              <select
                value={newBlip.sprite}
                onChange={(e) => setNewBlip({ ...newBlip, sprite: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-lg bg-white/5 border border-panel-border/60 text-sm text-white focus:outline-none focus:border-panel-accent/40 transition-colors"
              >
                {BLIP_SPRITES.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#1a1a2e]">{s.id} — {s.label}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('blipEditor.color')}</label>
              <div className="flex flex-wrap gap-1.5">
                {BLIP_COLORS.map(c => (
                  <button
                    key={c.id}
                    title={`${c.label} (${c.id})`}
                    onClick={() => setNewBlip({ ...newBlip, color: c.id })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${newBlip.color === c.id ? 'border-white scale-125' : 'border-transparent hover:border-white/40'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('blipEditor.scale')}: {newBlip.scale}</label>
              <input
                type="range" min="0.1" max="2.0" step="0.1"
                value={newBlip.scale}
                onChange={(e) => setNewBlip({ ...newBlip, scale: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-panel-border/40">
              <div>
                <p className="text-xs font-medium text-gray-300">{t('blipEditor.visibility')}</p>
                <p className="text-[10px] text-gray-500">{newBlip.jobOnly ? t('blipEditor.jobOnly') : t('blipEditor.everyone')}</p>
              </div>
              <button
                onClick={() => setNewBlip({ ...newBlip, jobOnly: !newBlip.jobOnly })}
                className={`relative w-10 h-5 rounded-full transition-colors ${newBlip.jobOnly ? 'bg-indigo-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${newBlip.jobOnly ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)} className="flex-1">{t('common.cancel')}</Button>
              <Button variant="primary" size="sm" onClick={handleCreate} className="flex-1" disabled={!newBlip.label}>{t('common.create')}</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowNew(true)} className="w-full">
            + {t('blipEditor.newBlip')}
          </Button>
        )}
      </div>
    </div>
  )
}
