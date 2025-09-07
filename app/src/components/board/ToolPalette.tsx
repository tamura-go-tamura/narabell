'use client'

import React, { useState } from 'react'
import { CardType } from '@/types/board'
import { useBoardStore } from '@/stores/boardStore'

interface ToolPaletteProps {
  className?: string
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { addCard, currentBoard } = useBoardStore()

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

  const handleAddCard = (type: CardType) => {
    if (!currentBoard) return

    // 新しいカードの位置を決定（空いている場所を探す）
    const findEmptyPosition = () => {
      const existingPositions = currentBoard.cards.map(card => ({
        x: card.position.x,
        y: card.position.y,
        w: card.size.w,
        h: card.size.h
      }))

      // グリッドの各位置をチェック
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < currentBoard.gridConfig.cols; x++) {
          const position = { x, y, w: 2, h: 2 }
          
          // この位置が既存のカードと重複していないかチェック
          const isOccupied = existingPositions.some(existing => 
            x < existing.x + existing.w &&
            x + position.w > existing.x &&
            y < existing.y + existing.h &&
            y + position.h > existing.y
          )

          if (!isOccupied && x + position.w <= currentBoard.gridConfig.cols) {
            return { x, y, w: position.w, h: position.h, z: 0 }
          }
        }
      }

      // 空いている場所がない場合は右下に配置
      return { x: 0, y: Math.max(...existingPositions.map(p => p.y + p.h), 0), w: 2, h: 2, z: 0 }
    }

    const position = findEmptyPosition()
    addCard(type, position)
  }

  return (
    <div className={`fixed top-4 left-4 z-10 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-semibold text-gray-800">Narabell</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* ツールパレット */}
        {isExpanded && (
          <div className="p-3">
            <div className="text-xs font-medium text-gray-600 mb-2">
              カードを追加
            </div>
            <div className="grid grid-cols-4 gap-2">
              {cardTypes.map((cardType) => (
                <button
                  key={cardType.type}
                  onClick={() => handleAddCard(cardType.type)}
                  disabled={!currentBoard}
                  className={`
                    p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    transition-all duration-200 group
                    ${!currentBoard ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={cardType.description}
                >
                  <div className="text-xl mb-1">{cardType.icon}</div>
                  <div className="text-xs text-gray-600 group-hover:text-blue-700">
                    {cardType.label}
                  </div>
                </button>
              ))}
            </div>

            {/* 追加情報 */}
            {!currentBoard && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                カードを追加するには、まずボードを作成してください
              </div>
            )}
          </div>
        )}

        {/* 最小化時のクイックアクセス */}
        {!isExpanded && (
          <div className="p-2 flex space-x-1">
            {cardTypes.slice(0, 3).map((cardType) => (
              <button
                key={cardType.type}
                onClick={() => handleAddCard(cardType.type)}
                disabled={!currentBoard}
                className={`
                  w-8 h-8 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50
                  focus:outline-none focus:ring-1 focus:ring-blue-500
                  ${!currentBoard ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={cardType.description}
              >
                <span className="text-sm">{cardType.icon}</span>
              </button>
            ))}
            <div className="text-gray-400 flex items-center text-xs">...</div>
          </div>
        )}
      </div>
    </div>
  )
}
