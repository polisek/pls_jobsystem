import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNuiEvent, fetchNui } from '../../hooks/useNui'
import { useUIStore } from '../../store/uiStore'

// ─── Types ──────────────────────────────────────────────────
interface AxisScreen { x: number; y: number }

interface GizmoUpdate {
  center: AxisScreen
  axes: { x: AxisScreen; y: AxisScreen; z: AxisScreen }
  worldPos: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  axisWorldLen: number  // world-space length of each projected axis vector (meters)
}

type GizmoAxis = 'x' | 'y' | 'z'
type GizmoMode = 'translate' | 'rotate'

const COLORS: Record<GizmoAxis, string> = { x: '#ef4444', y: '#22c55e', z: '#3b82f6' }
const LABEL: Record<GizmoAxis, string>  = { x: 'X', y: 'Y', z: 'Z' }
const AXES: GizmoAxis[] = ['x', 'y', 'z']

const GIZMO_PX = 90  // fixed visual arrow length in pixels

// ─── Arrow geometry helpers ──────────────────────────────────
function arrowHead(x1: number, y1: number, x2: number, y2: number, size = 8) {
  const dx = x2 - x1; const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return ''
  const ux = dx / len; const uy = dy / len
  const px = -uy * size * 0.5; const py = ux * size * 0.5
  return `M ${x2} ${y2} L ${x2 - ux * size + px} ${y2 - uy * size + py} L ${x2 - ux * size - px} ${y2 - uy * size - py} Z`
}

// ─── Component ───────────────────────────────────────────────
export default function GizmoPropPanel() {
  const { t } = useTranslation()
  const activePanel = useUIStore(s => s.activePanel)
  const [gizmo, setGizmo] = useState<GizmoUpdate | null>(null)
  const [mode, setMode] = useState<GizmoMode>('translate')
  const [hovered, setHovered] = useState<GizmoAxis | null>(null)

  // Active drag state — kept in ref to avoid stale closure in mousemove
  const dragRef = useRef<{
    axis: GizmoAxis
    lastX: number; lastY: number
    // normalized screen-space direction of this axis
    dirX: number; dirY: number
    // world units per pixel (for correct sensitivity)
    wPerPx: number
  } | null>(null)

  // Active camera-orbit state
  const orbitRef = useRef<{ lastX: number; lastY: number } | null>(null)

  // ── NUI event: receive updated screen projection ────────────
  useNuiEvent<GizmoUpdate>('gizmoUpdate', d => setGizmo(d))

  // ── Global mousemove / mouseup ───────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Axis drag
      if (dragRef.current) {
        const dr = dragRef.current
        const dx = e.clientX - dr.lastX
        const dy = e.clientY - dr.lastY
        const projected = dx * dr.dirX + dy * dr.dirY   // pixels along axis
        const worldDelta = projected * dr.wPerPx
        if (Math.abs(worldDelta) > 0.0001) {
          fetchNui('gizmoApplyDelta', { type: mode, axis: dr.axis, delta: worldDelta })
        }
        dragRef.current = { ...dr, lastX: e.clientX, lastY: e.clientY }
      }
      // Camera orbit
      if (orbitRef.current) {
        const dx = e.clientX - orbitRef.current.lastX
        fetchNui('gizmoCameraOrbit', { dx })
        orbitRef.current = { lastX: e.clientX, lastY: e.clientY }
      }
    }
    const onUp = (e: MouseEvent) => {
      if (e.button === 0) dragRef.current = null
      if (e.button === 2) orbitRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [mode])

  // ── Scroll = Z height ────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.05 : -0.05
      fetchNui('gizmoApplyDelta', { type: 'translate', axis: 'z', delta })
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  if (activePanel !== 'propGizmo') return null

  // ── Compute screen geometry ──────────────────────────────────
  const W = window.innerWidth
  const H = window.innerHeight
  const cx = gizmo ? gizmo.center.x * W : W / 2
  const cy = gizmo ? gizmo.center.y * H : H / 2

  const getAxisGeom = (axis: GizmoAxis) => {
    if (!gizmo) return { ex: cx + 80, ey: cy, dirX: 1, dirY: 0, wPerPx: 0.01 }
    const ap = gizmo.axes[axis]
    const ax = ap.x * W; const ay = ap.y * H
    const rawDx = ax - cx; const rawDy = ay - cy
    const rawLen = Math.sqrt(rawDx * rawDx + rawDy * rawDy)
    const dirX = rawLen > 0.5 ? rawDx / rawLen : 1
    const dirY = rawLen > 0.5 ? rawDy / rawLen : 0
    // World units per pixel: axisWorldLen meters shown as rawLen pixels
    const wPerPx = rawLen > 0.5 ? gizmo.axisWorldLen / rawLen : 0.01
    return { ex: cx + dirX * GIZMO_PX, ey: cy + dirY * GIZMO_PX, dirX, dirY, wPerPx }
  }

  const startAxisDrag = (axis: GizmoAxis, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const { dirX, dirY, wPerPx } = getAxisGeom(axis)
    dragRef.current = { axis, lastX: e.clientX, lastY: e.clientY, dirX, dirY, wPerPx }
  }

  const startOrbit = (e: React.MouseEvent) => {
    if (e.button !== 2) return
    e.preventDefault()
    orbitRef.current = { lastX: e.clientX, lastY: e.clientY }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: 'none' }}
    >
      {/* Full-screen right-click capture layer for camera orbit */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: 'all', cursor: orbitRef.current ? 'grabbing' : 'default' }}
        onMouseDown={startOrbit}
        onContextMenu={e => e.preventDefault()}
      />

      {/* ── SVG Gizmo ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none', overflow: 'visible' }}
      >
        {/* Drop shadow for visibility */}
        <defs>
          <filter id="gizmo-shadow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="black" floodOpacity="0.8" />
          </filter>
        </defs>

        {AXES.map(axis => {
          const { ex, ey } = getAxisGeom(axis)
          const color = COLORS[axis]
          const isHov = hovered === axis
          const isDrag = dragRef.current?.axis === axis
          const highlight = isDrag || isHov
          const sw = highlight ? 3.5 : 2.5
          const headPath = arrowHead(cx, cy, ex, ey, 10)

          return (
            <g key={axis} filter="url(#gizmo-shadow)">
              {/* Shaft */}
              <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth={sw} opacity={highlight ? 1 : 0.85} strokeLinecap="round" />
              {/* Arrow head */}
              <path d={headPath} fill={color} opacity={highlight ? 1 : 0.85} />
              {/* Invisible wide hit area */}
              <line
                x1={cx} y1={cy} x2={ex} y2={ey}
                stroke="transparent" strokeWidth={20}
                style={{ pointerEvents: 'stroke', cursor: isDrag ? 'grabbing' : 'grab' }}
                onMouseDown={e => startAxisDrag(axis, e)}
                onMouseEnter={() => setHovered(axis)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Endpoint circle */}
              <circle
                cx={ex} cy={ey} r={highlight ? 7 : 5}
                fill={color} stroke="white" strokeWidth={1.5}
                style={{ pointerEvents: 'all', cursor: isDrag ? 'grabbing' : 'grab' }}
                onMouseDown={e => startAxisDrag(axis, e)}
                onMouseEnter={() => setHovered(axis)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Axis label */}
              <text
                x={ex + (ex - cx > 0 ? 14 : -14)}
                y={ey + (ey - cy > 0 ? 5 : -5)}
                fill={color} fontSize={13} fontWeight="bold"
                textAnchor="middle" dominantBaseline="middle"
                style={{ pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 0 2px black)' }}
              >
                {LABEL[axis]}
              </text>
            </g>
          )
        })}

        {/* Center origin dot */}
        <circle cx={cx} cy={cy} r={5} fill="white" stroke="rgba(0,0,0,0.6)" strokeWidth={1.5} style={{ pointerEvents: 'none' }} filter="url(#gizmo-shadow)" />
      </svg>

      {/* ── Control panel (right side) ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5" style={{ pointerEvents: 'all' }}>

        {/* Mode toggle */}
        <div className="glass rounded-xl border border-panel-border p-1.5 flex flex-col gap-1">
          {(['translate', 'rotate'] as GizmoMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === m
                  ? m === 'translate'
                    ? 'bg-blue-500/25 text-blue-200 border border-blue-500/40'
                    : 'bg-purple-500/25 text-purple-200 border border-purple-500/40'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {m === 'translate' ? t('gizmo.translate') : t('gizmo.rotate')}
            </button>
          ))}
        </div>

        {/* Position / rotation readout */}
        {gizmo && (
          <div className="glass rounded-xl border border-panel-border p-3 flex flex-col gap-1.5 min-w-[120px]">
            <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{t('gizmo.position')}</p>
            {AXES.map(a => (
              <div key={a} className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold" style={{ color: COLORS[a] }}>{a.toUpperCase()}</span>
                <span className="text-[10px] font-mono text-gray-300">{(gizmo.worldPos as any)[a].toFixed(3)}</span>
              </div>
            ))}
            <div className="border-t border-panel-border/40 my-0.5" />
            <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{t('gizmo.rotation')}</p>
            {AXES.map(a => (
              <div key={a} className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold" style={{ color: COLORS[a] }}>{a.toUpperCase()}</span>
                <span className="text-[10px] font-mono text-gray-300">{(gizmo.rotation as any)[a].toFixed(1)}°</span>
              </div>
            ))}
          </div>
        )}

        {/* Confirm / Cancel */}
        <button
          onClick={() => fetchNui('gizmoConfirm')}
          className="py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-semibold hover:bg-green-500/30 active:scale-95 transition-all"
        >
          {t('gizmo.confirm')}
        </button>
        <button
          onClick={() => fetchNui('gizmoCancel')}
          className="py-2.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-semibold hover:bg-red-500/25 active:scale-95 transition-all"
        >
          {t('gizmo.cancel')}
        </button>
      </div>

      {/* ── Bottom hint ── */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 glass rounded-xl border border-panel-border px-4 py-2"
        style={{ pointerEvents: 'none' }}
      >
        <p className="text-xs text-gray-400 text-center">
          {t('gizmo.drag')} <span className="text-red-400 font-bold">X</span> <span className="text-green-400 font-bold">Y</span> <span className="text-blue-400 font-bold">Z</span> {t('gizmo.for')} {mode === 'translate' ? t('gizmo.toTranslate') : t('gizmo.toRotate')}
          &nbsp;·&nbsp;{t('gizmo.heightHint')}
          &nbsp;·&nbsp;{t('gizmo.orbitHint')}
        </p>
      </div>
    </div>
  )
}
