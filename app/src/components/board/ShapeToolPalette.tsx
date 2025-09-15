"use client"

import React, { useState, useRef } from 'react'

export type ShapeKind = 'rect' | 'circle'

interface ShapeToolPaletteProps {
  onCreateShape: (kind: ShapeKind) => void
  className?: string
  onDragShapeStart?: (kind: ShapeKind) => void
  onDragShapeEnd?: () => void
}
interface ToolDef { kind: ShapeKind; icon: string; hint: string }

const tools: ToolDef[] = [
  { kind: 'rect', icon: '▭', hint: '長方形 (クリックで中央 / ドラッグで配置)' },
  { kind: 'circle', icon: '◯', hint: '丸 (クリックで中央 / ドラッグで配置)' }
]

export const ShapeToolPalette: React.FC<ShapeToolPaletteProps> = ({ onCreateShape, className = '', onDragShapeStart, onDragShapeEnd }) => {
  const [active, setActive] = useState<ShapeKind | null>(null)
  const [dragging, setDragging] = useState<ShapeKind | null>(null)
  const transparentImgRef = useRef<HTMLImageElement | null>(null)

  const ensureTransparentImg = () => {
    if (transparentImgRef.current) return
    if (typeof window === 'undefined') return
    const img = new window.Image()
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP7iDqn8QAAAABJRU5ErkJggg=='
    transparentImgRef.current = img
  }

  const handleClick = (kind: ShapeKind) => { setActive(kind); onCreateShape(kind) }
  const handleDragStart = (e: React.DragEvent, kind: ShapeKind) => {
    ensureTransparentImg()
    e.dataTransfer.setData('application/x-shape-kind', kind)
    e.dataTransfer.effectAllowed = 'copy'
    setDragging(kind)
    onDragShapeStart?.(kind)
    if (transparentImgRef.current) {
      e.dataTransfer.setDragImage(transparentImgRef.current, 0, 0)
    }
  }
  const handleDragEnd = () => { setDragging(null); onDragShapeEnd?.() }

  // ベース: 細長い縦型 / ガラス風 / ホバーで軽く強調
  return (
    <div
      className={`pointer-events-auto flex flex-col items-center gap-1 p-2 rounded-2xl shadow-lg border border-gray-200/70 bg-white/70 backdrop-blur-md ${className}`}
      role="toolbar" aria-label="図形ツール"
    >
      {tools.map(t => {
        const isActive = active === t.kind
        const isDragging = dragging === t.kind
        return (
          <button
            key={t.kind}
            draggable
            onDragStart={(e) => handleDragStart(e, t.kind)}
            onDragEnd={handleDragEnd}
            onClick={() => handleClick(t.kind)}
            title={t.hint}
            aria-label={t.hint}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg font-normal select-none cursor-pointer transition-all
              border border-transparent relative
              ${isActive ? 'bg-blue-500 text-white shadow-inner' : 'text-gray-700 hover:bg-blue-50 active:bg-blue-100 hover:border-blue-300'}
              ${isDragging ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
              `}
          >
            <span className="pointer-events-none leading-none" style={{ transform: 'translateY(-1px)' }}>{t.icon}</span>
          </button>
        )
      })}
      {/* 仕切り */}
      <div className="w-6 h-px my-1 bg-gray-200" />
      {/* ヘルプミニアイコン (将来追加拡張用プレースホルダ) */}
      <div className="w-8 h-8 flex items-center justify-center text-[10px] text-gray-400 select-none" aria-hidden>i</div>
    </div>
  )
}

export default ShapeToolPalette
