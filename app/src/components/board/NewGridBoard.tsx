'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { InfiniteGrid } from '@/components/canvas/InfiniteGrid'
import { ZoomPanCanvas, TransformState } from '@/components/canvas/ZoomPanCanvas'
import { ShapeToolPalette, ShapeKind } from './ShapeToolPalette'
import { Shape, DEFAULT_SIZES, DEFAULT_STYLE } from '@/types/shape'

// グリッドセルサイズ（InfiniteGrid と合わせる）
const CELL_SIZE = 40
const VIRTUAL_CANVAS = { width: 4000, height: 3000 }

type HandleDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
interface ResizeSession { shapeId: string; startX: number; startY: number; startShape: Shape; dir: HandleDir }
interface MoveSession { shapeId: string; startX: number; startY: number; startShape: Shape }

// 初期シェイプ
const initialShapes: Shape[] = [
  { id: 'rect-1', kind: 'rect', x: 200, y: 160, w: 240, h: 160, label: 'Shape', z: 3 },
  { id: 'circle-1', kind: 'circle', x: 600, y: 200, w: 160, h: 160, label: '丸', z: 2 }
]

// Helper utilities (local for now; could move to lib/grid.ts if grows)
const quantize = (v: number) => Math.max(CELL_SIZE, Math.round(v / CELL_SIZE) * CELL_SIZE)
const quantizePos = (v: number) => Math.round(v / CELL_SIZE) * CELL_SIZE

export const NewGridBoard: React.FC = () => {
  const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, scale: 1 })
  const [shapes, setShapes] = useState<Shape[]>(initialShapes)
  const [hover, setHover] = useState<{ id: string | null; dir: HandleDir | null }>({ id: null, dir: null })
  const [dragPreview, setDragPreview] = useState<null | { kind: ShapeKind; cx: number; cy: number }>(null)
  const [dragCreatingKind, setDragCreatingKind] = useState<ShapeKind | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null)
  const resizeRef = useRef<ResizeSession | null>(null)
  const moveRef = useRef<MoveSession | null>(null)
  const shapeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const zoomApiRef = useRef<any>(null)

  const setShapeRef = (id: string) => (el: HTMLDivElement | null) => { shapeRefs.current[id] = el }
  const findShape = (id: string) => shapes.find(s => s.id === id)!

  const startResize = useCallback((e: React.PointerEvent, shapeId: string, dir: HandleDir) => {
    e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId)
    const shape = findShape(shapeId)
    resizeRef.current = { shapeId, startX: e.clientX, startY: e.clientY, startShape: { ...shape }, dir }
  }, [shapes])

  const startMove = useCallback((e: React.PointerEvent, shapeId: string) => {
    e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId)
    const shape = findShape(shapeId)
    moveRef.current = { shapeId, startX: e.clientX, startY: e.clientY, startShape: { ...shape } }
  }, [shapes])

  const detectEdge = useCallback((e: React.PointerEvent, shapeId: string): HandleDir | null => {
    if (resizeRef.current || moveRef.current) return null
    const el = shapeRefs.current[shapeId]
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const EDGE = 8
    const localX = e.clientX - rect.left
    const localY = e.clientY - rect.top
    const nearLeft = localX <= EDGE
    const nearRight = (rect.width - localX) <= EDGE
    const nearTop = localY <= EDGE
    const nearBottom = (rect.height - localY) <= EDGE
    if (nearTop && nearLeft) return 'nw'
    if (nearTop && nearRight) return 'ne'
    if (nearBottom && nearLeft) return 'sw'
    if (nearBottom && nearRight) return 'se'
    if (nearTop) return 'n'
    if (nearBottom) return 's'
    if (nearLeft) return 'w'
    if (nearRight) return 'e'
    return null
  }, [])

  const handleShapePointerMove = useCallback((e: React.PointerEvent, shapeId: string) => {
    const dir = detectEdge(e, shapeId)
    setHover({ id: dir ? shapeId : null, dir })
  }, [detectEdge])

  const handleShapePointerLeave = useCallback(() => {
    if (!resizeRef.current && !moveRef.current) setHover({ id: null, dir: null })
  }, [])

  const bringToFront = useCallback((shapeId: string) => {
    setShapes(prev => {
      const maxZ = prev.reduce((m, s) => Math.max(m, s.z), 0)
      return prev.map(s => s.id === shapeId ? { ...s, z: maxZ + 1 } : s)
    })
  }, [])

  const handleShapePointerDown = useCallback((e: React.PointerEvent, shapeId: string) => {
    bringToFront(shapeId)
    setSelectedId(shapeId)
    const dir = detectEdge(e, shapeId)
    dir ? startResize(e, shapeId, dir) : startMove(e, shapeId)
  }, [detectEdge, startResize, startMove, bringToFront])

  const applyShapeUpdate = (shapeId: string, updater: (s: Shape) => Shape) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? updater(s) : s))
  }

  const handleWrapperPointerMove = useCallback((e: React.PointerEvent) => {
    if (resizeRef.current) {
      const { shapeId, startX, startY, startShape, dir } = resizeRef.current
      const dx = (e.clientX - startX) / transform.scale
      const dy = (e.clientY - startY) / transform.scale

      if (startShape.kind === 'circle') {
        let { x, y, w } = startShape
        const right = startShape.x + startShape.w
        const bottom = startShape.y + startShape.h
        const minSize = CELL_SIZE
        const clampSize = (val: number) => quantize(Math.max(minSize, val))
        let newSize = w
        switch (dir) {
          case 'e': newSize = clampSize(startShape.w + dx); break
          case 's': newSize = clampSize(startShape.h + dy); break
          case 'w': { const newLeft = startShape.x + dx; newSize = clampSize(right - newLeft); x = quantizePos(Math.max(0, right - newSize)); break }
          case 'n': { const newTop = startShape.y + dy; newSize = clampSize(bottom - newTop); y = quantizePos(Math.max(0, bottom - newSize)); break }
          case 'se': { const candW = startShape.w + dx; const candH = startShape.h + dy; newSize = clampSize(Math.max(candW, candH)); break }
          case 'ne': { const candW = startShape.w + dx; const candH = bottom - (startShape.y + dy); newSize = clampSize(Math.max(candW, candH)); y = quantizePos(Math.max(0, bottom - newSize)); break }
          case 'sw': { const candW = right - (startShape.x + dx); const candH = startShape.h + dy; newSize = clampSize(Math.max(candW, candH)); x = quantizePos(Math.max(0, right - newSize)); break }
          case 'nw': { const candW = right - (startShape.x + dx); const candH = bottom - (startShape.y + dy); newSize = clampSize(Math.max(candW, candH)); x = quantizePos(Math.max(0, right - newSize)); y = quantizePos(Math.max(0, bottom - newSize)); break }
        }
        applyShapeUpdate(shapeId, () => ({ ...startShape, x, y, w: newSize, h: newSize }))
        return
      }

      let { x, y, w, h } = startShape
      const right = startShape.x + startShape.w
      const bottom = startShape.y + startShape.h
      const applyWest = () => { let nl = startShape.x + dx; const maxLeft = right - CELL_SIZE; if (nl > maxLeft) nl = maxLeft; if (nl < 0) nl = 0; nl = quantizePos(nl); x = nl; w = quantize(right - nl) }
      const applyEast = () => { w = quantize(Math.max(CELL_SIZE, startShape.w + dx)) }
      const applyNorth = () => { let nt = startShape.y + dy; const maxTop = bottom - CELL_SIZE; if (nt > maxTop) nt = maxTop; if (nt < 0) nt = 0; nt = quantizePos(nt); y = nt; h = quantize(bottom - nt) }
      const applySouth = () => { h = quantize(Math.max(CELL_SIZE, startShape.h + dy)) }
      switch (dir) { case 'w': applyWest(); break; case 'e': applyEast(); break; case 'n': applyNorth(); break; case 's': applySouth(); break; case 'nw': applyWest(); applyNorth(); break; case 'ne': applyEast(); applyNorth(); break; case 'sw': applyWest(); applySouth(); break; case 'se': applyEast(); applySouth(); break }
      applyShapeUpdate(shapeId, () => ({ ...startShape, x, y, w, h }))
      return
    }

    if (moveRef.current) {
      const { shapeId, startX, startY, startShape } = moveRef.current
      const dx = (e.clientX - startX) / transform.scale
      const dy = (e.clientY - startY) / transform.scale
      const newX = quantizePos(Math.max(0, startShape.x + dx))
      const newY = quantizePos(Math.max(0, startShape.y + dy))
      applyShapeUpdate(shapeId, prev => ({ ...prev, x: newX, y: newY }))
    }
  }, [transform.scale])

  const endInteractions = useCallback(() => { resizeRef.current = null; moveRef.current = null; setHover({ id: null, dir: null }) }, [])

  const cursorFor = (shapeId: string) => {
    if (moveRef.current?.shapeId === shapeId) return 'grabbing'
    if (resizeRef.current?.shapeId === shapeId) { const dir = resizeRef.current.dir; switch (dir) { case 'n': case 's': return 'ns-resize'; case 'e': case 'w': return 'ew-resize'; case 'ne': case 'sw': return 'nesw-resize'; case 'nw': case 'se': return 'nwse-resize'; } }
    if (hover.id === shapeId && hover.dir) { switch (hover.dir) { case 'n': case 's': return 'ns-resize'; case 'e': case 'w': return 'ew-resize'; case 'ne': case 'sw': return 'nesw-resize'; case 'nw': case 'se': return 'nwse-resize'; } }
    return 'grab'
  }

  const addShape = useCallback((kind: ShapeKind, dropPos?: { x: number; y: number }) => {
    const { w, h } = DEFAULT_SIZES[kind]
    setShapes(prev => {
      const nextZ = prev.reduce((m, s) => Math.max(m, s.z), 0) + 1
      const cx = dropPos ? dropPos.x : (-transform.x + window.innerWidth / 2) / transform.scale
      const cy = dropPos ? dropPos.y : (-transform.y + window.innerHeight / 2) / transform.scale
      const x = quantizePos(cx - w / 2)
      const y = quantizePos(cy - h / 2)
      return [...prev, { id: `${kind}-${Date.now()}`, kind, x, y, w, h, label: kind === 'rect' ? '四角' : '丸', z: nextZ, ...DEFAULT_STYLE }]
    })
  }, [transform])

  const resolveKind = (dt: DataTransfer, fallback: ShapeKind | null) => {
    const k = dt.getData('application/x-shape-kind') as ShapeKind | ''
    return (k === 'rect' || k === 'circle') ? k : fallback
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    const kind = resolveKind(e.dataTransfer, dragCreatingKind)
    if (!kind) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const cx = (e.clientX - rect.left - transform.x) / transform.scale
    const cy = (e.clientY - rect.top - transform.y) / transform.scale
    addShape(kind, { x: cx, y: cy })
    setDragPreview(null); setDragCreatingKind(null)
  }, [addShape, transform, dragCreatingKind])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    const kind = resolveKind(e.dataTransfer, dragCreatingKind)
    if (!kind) return
    e.preventDefault(); e.dataTransfer.dropEffect = 'copy'
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const cx = (e.clientX - rect.left - transform.x) / transform.scale
    const cy = (e.clientY - rect.top - transform.y) / transform.scale
    setDragPreview(prev => (prev && prev.kind === kind && Math.abs(prev.cx - cx) < 0.01 && Math.abs(prev.cy - cy) < 0.01) ? prev : { kind, cx, cy })
  }, [transform, dragCreatingKind])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) setDragPreview(null)
  }, [])

  const updateSelectedStyle = (patch: Partial<Shape>) => {
    if (!selectedId) return
    setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, ...patch } : s))
  }

  const updatePanelPos = useCallback(() => {
    if (!selectedId) { setPanelPos(null); return }
    const el = shapeRefs.current[selectedId]
    const root = rootRef.current
    if (!el || !root) return
    const r = el.getBoundingClientRect()
    const rr = root.getBoundingClientRect()
    const x = r.right - rr.left + 12 // shape右側少し外
    const y = r.top - rr.top // 上揃え（必要なら + (r.height/2 - 16) で中央）
    setPanelPos({ x, y })
  }, [selectedId])

  useEffect(() => { updatePanelPos() }, [updatePanelPos, transform, shapes])
  useEffect(() => {
    const onResize = () => updatePanelPos()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [updatePanelPos])

  return (
    <div ref={rootRef} className="relative w-full h-full bg-white select-none overflow-hidden touch-none">
      {/* Style panel (now positioned near selected shape) */}
      {selectedId && panelPos && (() => {
        const s = shapes.find(sh => sh.id === selectedId)
        if (!s) return null
        // Simple hex -> rgb helper for opacity gradient
        const toRgb = (hex: string) => {
          let h = hex.replace('#','')
          if (h.length === 3) h = h.split('').map(c=>c+c).join('')
          const r = parseInt(h.slice(0,2),16); const g = parseInt(h.slice(2,4),16); const b = parseInt(h.slice(4,6),16)
          return { r, g, b }
        }
        const fillColor = s.fill || '#ffffff'
        const { r, g, b } = toRgb(fillColor)
        const presets = ['#FFFFFF','#FEF08A','#BFDBFE','#C7D2FE','#FBCFE8','#DCFCE7','#FEE2E2','#E5E7EB']
        return (
          <div
            className="absolute z-50 w-48 bg-white/70 backdrop-blur-xl px-3 py-2 rounded-xl shadow-xl border border-white/60 ring-1 ring-black/5 text-[11px] flex flex-col gap-2"
            style={{ left: panelPos.x, top: panelPos.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between -mb-1">
              <span className="font-medium text-gray-700 tracking-wide">Style</span>
              <button aria-label="close" onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 transition-colors leading-none">×</button>
            </div>
            {/* Fill */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Fill</span>
              <button
                title="Fill color"
                onClick={() => {
                  const el = document.getElementById('fill-input-'+s.id) as HTMLInputElement | null; el?.click()
                }}
                className="relative w-7 h-7 rounded-full ring-1 ring-black/10 shadow-sm overflow-hidden flex items-center justify-center"
                style={{ background: s.fill || '#ffffff' }}
              >
                <span className="sr-only">Pick fill color</span>
              </button>
              <input id={'fill-input-'+s.id} type="color" value={s.fill || '#ffffff'} onChange={(e) => updateSelectedStyle({ fill: e.target.value })} className="hidden" />
            </div>
            {/* Stroke & width */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Stroke</span>
              <button
                title="Stroke color"
                onClick={() => { const el = document.getElementById('stroke-input-'+s.id) as HTMLInputElement | null; el?.click() }}
                className="relative w-7 h-7 rounded-full ring-1 ring-black/10 shadow-sm overflow-hidden flex items-center justify-center"
                style={{ background: s.stroke || '#555555' }}
              >
                <span className="sr-only">Pick stroke color</span>
              </button>
              <input id={'stroke-input-'+s.id} type="color" value={s.stroke || '#555555'} onChange={(e) => updateSelectedStyle({ stroke: e.target.value })} className="hidden" />
              <input
                aria-label="stroke width"
                type="number"
                min={0}
                max={12}
                value={s.strokeWidth ?? 2}
                onChange={(e) => updateSelectedStyle({ strokeWidth: Number(e.target.value) })}
                className="w-12 px-1 py-0.5 border border-gray-200 rounded text-[11px] text-center bg-white/70 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            {/* Preset swatches */}
            <div className="flex flex-wrap gap-1 mt-1">
              {presets.map(c => (
                <button
                  key={c}
                  title={c}
                  onClick={() => updateSelectedStyle({ fill: c })}
                  className={`w-5 h-5 rounded ring-1 ring-black/10 hover:ring-blue-400 transition-shadow ${s.fill === c ? 'outline outline-[2px] outline-blue-500/60' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            {/* Opacity */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Opacity</span>
                <span className="tabular-nums w-10 text-right text-gray-600">{Math.round((s.opacity ?? 1) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full rounded bg-gradient-to-r" style={{ background: `linear-gradient(to right, rgba(${r},${g},${b},0) , rgba(${r},${g},${b},1))` }} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={s.opacity ?? 1}
                onChange={(e) => updateSelectedStyle({ opacity: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        )
      })()}
      <InfiniteGrid cellSize={CELL_SIZE} viewportX={transform.x} viewportY={transform.y} viewportScale={transform.scale} className="z-0" />
      <ShapeToolPalette
        onCreateShape={(k) => addShape(k)}
        onDragShapeStart={(k) => setDragCreatingKind(k)}
        onDragShapeEnd={() => { setDragCreatingKind(null); setDragPreview(null) }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50"
      />
      <ZoomPanCanvas onTransformChange={setTransform} className="w-full h-full z-10 relative" onApi={(api) => { zoomApiRef.current = api }}>
        <div
          className="relative"
          style={{ width: VIRTUAL_CANVAS.width, height: VIRTUAL_CANVAS.height }}
          onPointerMove={handleWrapperPointerMove}
          onPointerUp={endInteractions}
            onPointerLeave={endInteractions}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragPreview && (() => {
            const { w, h } = DEFAULT_SIZES[dragPreview.kind]
            const isCircle = dragPreview.kind === 'circle'
            const left = quantizePos(dragPreview.cx - w / 2)
            const top = quantizePos(dragPreview.cy - h / 2)
            return (
              <div
                aria-hidden
                className="pointer-events-none absolute border-2 border-blue-500 border-dashed bg-blue-500/10"
                style={{ left, top, width: w, height: h, zIndex: 9999, borderRadius: isCircle ? '9999px' : 6, aspectRatio: isCircle ? '1 / 1' : undefined }}
              />
            )
          })()}

          {shapes.map(shape => {
            const isCircle = shape.kind === 'circle'
            const baseClasses = 'absolute shadow-sm flex items-center justify-center font-medium text-gray-700 text-sm select-none'
            const isSelected = shape.id === selectedId
            const style: React.CSSProperties = {
              left: shape.x,
              top: shape.y,
              width: shape.w,
              height: shape.h,
              cursor: cursorFor(shape.id),
              zIndex: shape.z,
              background: shape.fill,
              border: `${shape.strokeWidth ?? 2}px solid ${shape.stroke ?? '#555'}`,
              borderRadius: isCircle ? '9999px' : 6,
              boxShadow: isSelected ? '0 0 0 2px #3b82f680, 0 1px 2px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.1)',
              opacity: shape.opacity ?? 1
            }
            return (
              <div
                key={shape.id}
                ref={setShapeRef(shape.id)}
                aria-label={`shape-${shape.kind}`}
                className={baseClasses}
                style={style}
                onPointerMove={(e) => handleShapePointerMove(e, shape.id)}
                onPointerLeave={handleShapePointerLeave}
                onPointerDown={(e) => handleShapePointerDown(e, shape.id)}
              >
                {shape.label}
              </div>
            )
          })}
        </div>
      </ZoomPanCanvas>
    </div>
  )
}

export default NewGridBoard
