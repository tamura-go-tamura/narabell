'use client'

import React from 'react'
import { CardType } from '@/types/board'
import { Position } from '@/lib/coordinates'

interface NewPreviewCardProps {
  cardType: CardType
  position: Position  // スクリーン座標でのカード中央座標
  cellSize: number    // ベースセルサイズ（スケール適用前）
  scale: number       // ズームスケール
  className?: string
  snapToGrid?: boolean
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
  scale,
  className = '',
  snapToGrid = true
}) => {
  const cardInfo = getCardTypeInfo(cardType)
  
  // カードサイズを計算（2x2セル、スケール適用）
  const scaledCellSize = cellSize * scale
  const width = 2 * scaledCellSize
  const height = 2 * scaledCellSize
  
  // 中央座標から左上座標を計算
  const finalX = position.x - width / 2
  const finalY = position.y - height / 2

  console.log('🎯 NewPreviewCard rendering:', {
    cardType,
    centerPosition: position,
    finalPosition: { x: finalX, y: finalY },
    size: { width, height },
    cellSize,
    scale,
    scaledCellSize
  })

  return (
    <div
      className={`
        fixed pointer-events-none z-50 
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
        transition: 'none', // アニメーションは無効（滑らかさよりも正確性を優先）
      }}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{cardInfo.icon}</div>
        <div className="text-xs font-medium text-gray-600">{cardInfo.label}</div>
      </div>
    </div>
  )
})
