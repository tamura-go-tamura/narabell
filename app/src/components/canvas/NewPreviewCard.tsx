'use client'

import React from 'react'
import { CardType } from '@/types/board'
import { Position } from '@/lib/coordinates'

interface NewPreviewCardProps {
  cardType: CardType
  position: Position  // ピクセル座標
  cellSize: number
  className?: string
  snapToGrid?: boolean // グリッドにスナップするかどうか
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

export const NewPreviewCard: React.FC<NewPreviewCardProps> = React.memo(({ 
  cardType, 
  position,
  cellSize,
  className = '',
  snapToGrid = true
}) => {
  const cardInfo = getCardTypeInfo(cardType)
  
  // スナップが有効な場合はグリッドにスナップした位置を計算、無効な場合はそのまま使用
  const finalX = snapToGrid ? Math.floor(position.x / cellSize) * cellSize : position.x
  const finalY = snapToGrid ? Math.floor(position.y / cellSize) * cellSize : position.y
  const width = 2 * cellSize // 2セル分の幅
  const height = 2 * cellSize // 2セル分の高さ

  return (
    <div
      className={`
        absolute pointer-events-none z-50 
        border-4 border-dashed rounded-lg 
        ${cardInfo.color}
        opacity-80
        flex items-center justify-center
        shadow-lg
        ${className}
      `}
      style={{
        left: `${finalX}px`,
        top: `${finalY}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: 'translate3d(0, 0, 0)', // GPU加速を有効化
        willChange: 'transform', // 最適化のヒント
        transition: snapToGrid ? 'left 0.1s ease-out, top 0.1s ease-out' : 'none', // スナップ時のみアニメーション
      }}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{cardInfo.icon}</div>
        <div className="text-xs font-medium text-gray-600">{cardInfo.label}</div>
      </div>
    </div>
  )
})
