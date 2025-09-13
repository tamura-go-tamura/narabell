'use client'

import React, { useState, useCallback, useRef } from 'react'
import { InfiniteGrid } from '@/components/canvas/InfiniteGrid'
import { ZoomPanCanvas, TransformState } from '@/components/canvas/ZoomPanCanvas'

// グリッドセルサイズ（InfiniteGrid と合わせる）
const CELL_SIZE = 40
interface Shape { id: string; kind: 'rect' | 'circle'; x: number; y: number; w: number; h: number; label: string; z: number }
const initialShapes: Shape[] = [
  { id: 'rect-1', kind: 'rect', x: 200, y: 160, w: 240, h: 160, label: 'Shape', z: 3 },
  { id: 'circle-1', kind: 'circle', x: 600, y: 200, w: 160, h: 160, label: '丸', z: 2 }
]
const VIRTUAL_CANVAS = { width: 4000, height: 3000 }

type HandleDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
interface ResizeSession { shapeId: string; startX: number; startY: number; startShape: Shape; dir: HandleDir }
interface MoveSession { shapeId: string; startX: number; startY: number; startShape: Shape }

export const NewGridBoard: React.FC = () => {
  const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, scale: 1 })
  const [shapes, setShapes] = useState<Shape[]>(initialShapes)
  const [hover, setHover] = useState<{ id: string | null; dir: HandleDir | null }>({ id: null, dir: null })
  const resizeRef = useRef<ResizeSession | null>(null)
  const moveRef = useRef<MoveSession | null>(null)
  const shapeRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const quantize = (v: number) => Math.max(CELL_SIZE, Math.round(v / CELL_SIZE) * CELL_SIZE)
  const quantizePos = (v: number) => Math.round(v / CELL_SIZE) * CELL_SIZE

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
    const EDGE = 8 // px (視覚座標)
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
    if (!resizeRef.current && !moveRef.current) {
      setHover({ id: null, dir: null })
    }
  }, [])

  const bringToFront = useCallback((shapeId: string) => {
    setShapes(prev => {
      const maxZ = prev.reduce((m, s) => Math.max(m, s.z), 0)
      return prev.map(s => s.id === shapeId ? { ...s, z: maxZ + 1 } : s)
    })
  }, [])

  const handleShapePointerDown = useCallback((e: React.PointerEvent, shapeId: string) => {
    bringToFront(shapeId)
    const dir = detectEdge(e, shapeId)
    if (dir) {
      startResize(e, shapeId, dir)
    } else {
      startMove(e, shapeId)
    }
  }, [detectEdge, startResize, startMove, bringToFront])

  const applyShapeUpdate = (shapeId: string, updater: (s: Shape) => Shape) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? updater(s) : s))
  }

  const handleWrapperPointerMove = useCallback((e: React.PointerEvent) => {
    // Resize
    if (resizeRef.current) {
      const { shapeId, startX, startY, startShape, dir } = resizeRef.current
      const dx = (e.clientX - startX) / transform.scale
      const dy = (e.clientY - startY) / transform.scale

      // 円 (circle) は常に正円
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

      // 四角形
      let { x, y, w, h } = startShape
      const right = startShape.x + startShape.w
      const bottom = startShape.y + startShape.h
      const applyWest = () => { let newLeft = startShape.x + dx; const maxLeft = right - CELL_SIZE; if (newLeft > maxLeft) newLeft = maxLeft; if (newLeft < 0) newLeft = 0; newLeft = quantizePos(newLeft); x = newLeft; w = quantize(right - newLeft) }
      const applyEast = () => { w = quantize(Math.max(CELL_SIZE, startShape.w + dx)) }
      const applyNorth = () => { let newTop = startShape.y + dy; const maxTop = bottom - CELL_SIZE; if (newTop > maxTop) newTop = maxTop; if (newTop < 0) newTop = 0; newTop = quantizePos(newTop); y = newTop; h = quantize(bottom - newTop) }
      const applySouth = () => { h = quantize(Math.max(CELL_SIZE, startShape.h + dy)) }
      switch (dir) { case 'w': applyWest(); break; case 'e': applyEast(); break; case 'n': applyNorth(); break; case 's': applySouth(); break; case 'nw': applyWest(); applyNorth(); break; case 'ne': applyEast(); applyNorth(); break; case 'sw': applyWest(); applySouth(); break; case 'se': applyEast(); applySouth(); break }
      applyShapeUpdate(shapeId, () => ({ ...startShape, x, y, w, h }))
      return
    }

    // Move
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

  return (
    <div className="relative w-full h-full bg-white select-none overflow-hidden touch-none">
      <ZoomPanCanvas onTransformChange={setTransform} className="w-full h-full">
        <div
          className="relative"
          style={{ width: VIRTUAL_CANVAS.width, height: VIRTUAL_CANVAS.height }}
          onPointerMove={handleWrapperPointerMove}
          onPointerUp={endInteractions}
          onPointerLeave={endInteractions}
        >
          <InfiniteGrid cellSize={CELL_SIZE} className="pointer-events-none" />
          {shapes.map(shape => {
            const baseClasses = 'absolute bg-white shadow-sm flex items-center justify-center font-medium text-gray-700 text-sm select-none'
            const shapeClass = shape.kind === 'circle' ? 'rounded-full border border-gray-400' : 'rounded-md border border-gray-400'
            const extraStyle: React.CSSProperties = { left: shape.x, top: shape.y, width: shape.w, height: shape.h, cursor: cursorFor(shape.id), zIndex: shape.z }
            return (
              <div
                key={shape.id}
                ref={setShapeRef(shape.id)}
                aria-label={`shape-${shape.kind}`}
                className={`${baseClasses} ${shapeClass}`}
                style={extraStyle}
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
