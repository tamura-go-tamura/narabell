'use client'

import React from 'react'

interface NewPreviewCardProps {
  cardType: 'shape'
  position: { x: number; y: number }
  cellSize: number
  scale: number
  className?: string
  snapToGrid?: boolean
}

const getCardTypeInfo = () => ({ icon: '🔲', label: '図形', color: 'bg-gray-100 border-gray-300' })

export const NewPreviewCard: React.FC<NewPreviewCardProps> = React.memo(({ 
  cardType, 
  position,
  cellSize,
  scale,
  className = '',
  snapToGrid = true
}) => {
  const cardInfo = getCardTypeInfo()
  const scaledCell = cellSize * scale
  const width = 2 * scaledCell
  const height = 2 * scaledCell
  const finalX = position.x
  const finalY = position.y

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
