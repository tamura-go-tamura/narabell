"use client"

import React, { useState } from 'react'

export type ShapeKind = 'rect' | 'circle'

interface ShapeToolPaletteProps { onCreateShape: (kind: ShapeKind) => void; className?: string }
interface ToolDef { kind: ShapeKind; icon: string; hint: string }

const tools: ToolDef[] = [
  { kind: 'rect', icon: '▭', hint: '長方形 (クリックで中央 / ドラッグで配置)' },
  { kind: 'circle', icon: '◯', hint: '丸 (クリックで中央 / ドラッグで配置)' }
]

export const ShapeToolPalette: React.FC<ShapeToolPaletteProps> = ({ onCreateShape, className = '' }) => {
  const [active, setActive] = useState<ShapeKind | null>(null)

  const handleClick = (kind: ShapeKind) => { setActive(kind); onCreateShape(kind) }
  const handleDragStart = (e: React.DragEvent, kind: ShapeKind) => { e.dataTransfer.setData('application/x-shape-kind', kind); e.dataTransfer.effectAllowed = 'copy' }

  // ベース: 細長い縦型 / ガラス風 / ホバーで軽く強調
  return (
    <div
      className={`pointer-events-auto flex flex-col items-center gap-1 p-2 rounded-2xl shadow-lg border border-gray-200/70 bg-white/70 backdrop-blur-md ${className}`}
      role="toolbar" aria-label="図形ツール"
    >
      {tools.map(t => {
        const isActive = active === t.kind
        return (
          <button
            key={t.kind}
            draggable
            onDragStart={(e) => handleDragStart(e, t.kind)}
            onClick={() => handleClick(t.kind)}
            title={t.hint}
            aria-label={t.hint}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg font-normal select-none cursor-pointer transition-all
              border border-transparent
              ${isActive ? 'bg-blue-500 text-white shadow-inner' : 'text-gray-700 hover:bg-blue-50 active:bg-blue-100 hover:border-blue-300'}
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
