'use client'

import React from 'react'
import { CardType } from '@/types/board'

interface PreviewCardProps {
  cardType: CardType
  position: { x: number; y: number }
  gridConfig: {
    rowHeight: number
    margin: [number, number]
  }
  gridLayoutWidth?: number
  gridLayoutCols?: number
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

export const PreviewCard: React.FC<PreviewCardProps> = ({ 
  cardType, 
  position, 
  gridConfig,
  gridLayoutWidth = 1600,
  gridLayoutCols = 20
}) => {
  const cardInfo = getCardTypeInfo(cardType)
  
  // グリッド位置を実際のピクセル位置に変換（react-grid-layoutの計算に合わせる）
  const colWidth = gridLayoutWidth / gridLayoutCols
  const left = position.x * colWidth
  const top = position.y * gridConfig.rowHeight
  const width = 2 * colWidth // 2セル分の幅
  const height = 2 * gridConfig.rowHeight // 2セル分の高さ

  return (
    <div
      className={`
        absolute pointer-events-none z-50 
        border-2 border-dashed rounded-lg 
        ${cardInfo.color}
        opacity-70 transition-all duration-150
        flex items-center justify-center
      `}
      style={{
        left: `${left}px`,
        top: `${top}px`,
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
