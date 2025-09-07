'use client'

import React from 'react'
import { CardType } from '@/types/board'
import { Position } from '@/lib/coordinates'

interface NewPreviewCardProps {
  cardType: CardType
  position: Position  // ピクセル座標
  cellSize: number
  className?: string
}

const getCardTypeInfo = (type: CardType) => {
  const cardTypes = {
    text: { icon: '📝', label: 'テキスト', color: 'bg-blue-100 border-blue-300' },
    image: { icon: '🖼️', label: '画像', color: 'bg-green-100 border-green-300' },
    list: { icon: '📋', label: 'リスト', color: 'bg-yellow-100 border-yellow-300' },
    chart: { icon: '📊', label: 'チャート', color: 'bg-purple-100 border-purple-300' },
    link: { icon: '🔗', label: 'リンク', color: 'bg-indigo-100 border-indigo-300' },
    calendar: { icon: '📅', label: 'カレンダー', color: 'bg-red-100 border-red-300' },
    shape: { icon: '🔲', label: '図形', color: 'bg-gray-100 border-gray-300' }
  }
  return cardTypes[type] || cardTypes.text
}

export const NewPreviewCard: React.FC<NewPreviewCardProps> = ({ 
  cardType, 
  position,
  cellSize,
  className = ''
}) => {
  const cardInfo = getCardTypeInfo(cardType)
  
  // グリッドにスナップした位置を計算
  const snappedX = Math.floor(position.x / cellSize) * cellSize
  const snappedY = Math.floor(position.y / cellSize) * cellSize
  const width = 2 * cellSize // 2セル分の幅
  const height = 2 * cellSize // 2セル分の高さ

  console.log('🎨 NewPreviewCard rendering:', { 
    cardType, 
    position, 
    snapped: { x: snappedX, y: snappedY },
    size: { width, height }
  })

  return (
    <div
      className={`
        absolute pointer-events-none z-50 
        border-4 border-dashed rounded-lg 
        ${cardInfo.color}
        opacity-80 transition-all duration-150
        flex items-center justify-center
        shadow-lg
        ${className}
      `}
      style={{
        left: `${snappedX}px`,
        top: `${snappedY}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{cardInfo.icon}</div>
        <div className="text-xs font-medium text-gray-600">{cardInfo.label}</div>
      </div>
    </div>
  )
}
