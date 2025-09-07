'use client'

import React, { useState } from 'react'
import { CardType } from '@/types/board'
import { useBoardStore } from '@/stores/boardStore'

interface ToolPaletteProps {
  className?: string
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [draggedType, setDraggedType] = useState<CardType | null>(null)
  const { currentBoard, isGridVisible, toggleGrid, isSnapToGrid, toggleSnapToGrid } = useBoardStore()

  const cardTypes: Array<{
    type: CardType
    icon: string
    label: string
    description: string
  }> = [
    {
      type: 'text',
      icon: '📝',
      label: 'テキスト',
      description: 'テキストカードを追加'
    },
    {
      type: 'image',
      icon: '🖼️',
      label: '画像',
      description: '画像カードを追加'
    },
    {
      type: 'list',
      icon: '📋',
      label: 'リスト',
      description: 'チェックリストを追加'
    },
    {
      type: 'chart',
      icon: '📊',
      label: 'チャート',
      description: 'グラフ・チャートを追加'
    },
    {
      type: 'link',
      icon: '🔗',
      label: 'リンク',
      description: 'リンクカードを追加'
    },
    {
      type: 'calendar',
      icon: '📅',
      label: 'カレンダー',
      description: 'カレンダーカードを追加'
    },
    {
      type: 'shape',
      icon: '🔲',
      label: '図形',
      description: '図形カードを追加'
    }
  ]

  // ドラッグ開始ハンドラー
  const handleDragStart = (e: React.DragEvent, cardType: CardType) => {
    console.log('🚀 ToolPalette drag start:', cardType)
    
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'card-type',
      cardType: cardType
    }))
    e.dataTransfer.effectAllowed = 'copy'
    setDraggedType(cardType)
    
    // グローバルイベントでドラッグ開始を通知
    console.log('🚀 Dispatching cardDragStart event')
    window.dispatchEvent(new CustomEvent('cardDragStart', { 
      detail: { cardType } 
    }))
    
    // ドラッグ中のプレビュー画像を設定
    const dragImage = document.createElement('div')
    dragImage.innerHTML = `
      <div style="
        padding: 8px 12px;
        background: white;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span style="font-size: 16px;">${cardTypes.find(ct => ct.type === cardType)?.icon}</span>
        <span>${cardTypes.find(ct => ct.type === cardType)?.label}</span>
      </div>
    `
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 50, 25)
    
    // プレビュー要素を後で削除
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }

  // ドラッグ終了ハンドラー
  const handleDragEnd = () => {
    console.log('🚀 ToolPalette drag end')
    setDraggedType(null)
    // グローバルイベントでドラッグ終了を通知
    window.dispatchEvent(new CustomEvent('cardDragEnd'))
  }

  return (
    <div className={`fixed top-4 left-4 z-20 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-semibold text-gray-800 text-sm">Narabell</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>

        {/* ツールパレット - 縦型レイアウト */}
        {isExpanded && (
          <div className="p-3 w-64">
            <div className="text-xs font-medium text-gray-600 mb-3">
              カードツール
            </div>
            
            {/* カードタイプ - 縦に並べる */}
            <div className="space-y-2">
              {cardTypes.map((cardType) => (
                <div
                  key={cardType.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, cardType.type)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center p-3 rounded-lg border border-gray-200 
                    hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm
                    cursor-move transition-all duration-200 group
                    ${!currentBoard ? 'opacity-50 cursor-not-allowed' : ''}
                    ${draggedType === cardType.type ? 'opacity-50 scale-95' : ''}
                  `}
                  title={`${cardType.description} - ドラッグしてキャンバスに配置`}
                >
                  <div className="text-2xl mr-3">{cardType.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                      {cardType.label}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-blue-600">
                      ドラッグ&ドロップで配置
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-500">
                    ⋮⋮
                  </div>
                </div>
              ))}
            </div>

            {/* グリッド設定 */}
            {currentBoard && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-600 mb-3">
                  表示設定
                </div>
                
                {/* グリッド表示/スナップ切り替え */}
                <div className="space-y-2">
                  <button
                    onClick={toggleGrid}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${isGridVisible 
                        ? 'bg-blue-100 border-blue-300 text-blue-700' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    title="グリッド表示を切り替え"
                  >
                    <div className="flex items-center">
                      <span className="mr-2">📐</span>
                      <span>グリッド表示</span>
                    </div>
                    <div className={`text-xs ${isGridVisible ? 'text-blue-600' : 'text-gray-400'}`}>
                      {isGridVisible ? 'ON' : 'OFF'}
                    </div>
                  </button>
                  
                  <button
                    onClick={toggleSnapToGrid}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${isSnapToGrid 
                        ? 'bg-green-100 border-green-300 text-green-700' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    title="グリッドにスナップ"
                  >
                    <div className="flex items-center">
                      <span className="mr-2">🧲</span>
                      <span>グリッドスナップ</span>
                    </div>
                    <div className={`text-xs ${isSnapToGrid ? 'text-green-600' : 'text-gray-400'}`}>
                      {isSnapToGrid ? 'ON' : 'OFF'}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 追加情報 */}
            {!currentBoard && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                カードを追加するには、まずボードを作成してください
              </div>
            )}
          </div>
        )}

        {/* 最小化時のクイックアクセス */}
        {!isExpanded && (
          <div className="p-2 flex space-x-1">
            {cardTypes.slice(0, 3).map((cardType) => (
              <div
                key={cardType.type}
                draggable
                onDragStart={(e) => handleDragStart(e, cardType.type)}
                onDragEnd={handleDragEnd}
                className={`
                  w-8 h-8 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50
                  focus:outline-none focus:ring-1 focus:ring-blue-500
                  ${!currentBoard ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}
                  ${draggedType === cardType.type ? 'opacity-50 scale-95' : ''}
                  flex items-center justify-center transition-all duration-200
                `}
                title={`${cardType.description} - ドラッグしてキャンバスに配置`}
              >
                <span className="text-sm">{cardType.icon}</span>
              </div>
            ))}
            <div className="text-gray-400 flex items-center text-xs">...</div>
          </div>
        )}
      </div>
    </div>
  )
}
