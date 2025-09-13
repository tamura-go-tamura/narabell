'use client'

import React, { useState } from 'react'
import { CardType } from '@/types/board'
import { useBoardStore } from '@/stores/boardStore'

interface ToolPaletteProps { className?: string }

export const ToolPalette: React.FC<ToolPaletteProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [draggedType, setDraggedType] = useState<CardType | null>(null)
  const { currentBoard, isGridVisible, toggleGrid, isSnapToGrid, toggleSnapToGrid } = useBoardStore()

  const cardTypes: Array<{ type: CardType; icon: string; label: string; description: string }> = [
    { type: 'shape', icon: '▭', label: '四角', description: '基本図形（四角）を追加' }
  ]

  const handleDragStart = (e: React.DragEvent, cardType: CardType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'card-type', cardType }))
    e.dataTransfer.effectAllowed = 'copy'
    setDraggedType(cardType)
    window.dispatchEvent(new CustomEvent('cardDragStart', { detail: { cardType } }))
    const dragImage = document.createElement('div')
    dragImage.innerHTML = `<div style="padding:6px 10px;background:white;border:2px solid #3b82f6;border-radius:6px;font-size:12px;display:flex;gap:6px;align-items:center;">${cardTypes[0].icon}<span>${cardTypes[0].label}</span></div>`
    dragImage.style.position = 'absolute'; dragImage.style.top = '-1000px'; document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 40, 20)
    setTimeout(() => { document.body.removeChild(dragImage) }, 0)
  }

  const handleDragEnd = () => {
    setDraggedType(null)
    window.dispatchEvent(new CustomEvent('cardDragEnd'))
  }

  return (
    <div className={`fixed top-4 left-4 z-20 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2"><span className="text-lg">🔔</span><h3 className="font-semibold text-gray-800 text-sm">Narabell</h3></div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500 hover:text-gray-700">{isExpanded ? '◀' : '▶'}</button>
        </div>
        {isExpanded && (
          <div className="p-3 w-60">
            <div className="text-xs font-medium text-gray-600 mb-3">カードツール</div>
            <div className="space-y-2">
              {cardTypes.map(ct => (
                <div key={ct.type} draggable onDragStart={(e) => handleDragStart(e, ct.type)} onDragEnd={handleDragEnd}
                  className={`flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-move transition-all ${!currentBoard ? 'opacity-50 cursor-not-allowed' : ''} ${draggedType === ct.type ? 'opacity-50 scale-95' : ''}`}
                  title={`${ct.description} - ドラッグして配置`}>
                  <div className="text-xl mr-3">{ct.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{ct.label}</div>
                    <div className="text-xs text-gray-500">ドラッグ&ドロップで配置</div>
                  </div>
                </div>
              ))}
            </div>
            {currentBoard && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-600 mb-3">表示設定</div>
                <div className="space-y-2">
                  <button onClick={toggleGrid} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border ${isGridVisible ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}> <span className="flex items-center"><span className="mr-2">📐</span>グリッド表示</span><span className={`text-xs ${isGridVisible ? 'text-blue-600' : 'text-gray-400'}`}>{isGridVisible ? 'ON' : 'OFF'}</span></button>
                  <button onClick={toggleSnapToGrid} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border ${isSnapToGrid ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}> <span className="flex items-center"><span className="mr-2">🧲</span>グリッドスナップ</span><span className={`text-xs ${isSnapToGrid ? 'text-green-600' : 'text-gray-400'}`}>{isSnapToGrid ? 'ON' : 'OFF'}</span></button>
                </div>
              </div>
            )}
            {!currentBoard && (<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">ボードを作成してください</div>)}
          </div>
        )}
        {!isExpanded && (
          <div className="p-2 flex space-x-1">
            {cardTypes.map(ct => (
              <div key={ct.type} draggable onDragStart={(e) => handleDragStart(e, ct.type)} onDragEnd={handleDragEnd}
                className={`w-8 h-8 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 ${!currentBoard ? 'opacity-50 cursor-not-allowed' : 'cursor-move'} ${draggedType === ct.type ? 'opacity-50 scale-95' : ''} flex items-center justify-center`}
                title={`${ct.description} - ドラッグして配置`}>
                <span className="text-sm">{ct.icon}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 最小構成: 未使用 (ToolPalette 削除)
export {}
