'use client'

import React from 'react'

interface PreviewCardProps {
  cardType: 'shape'
  position: { x: number; y: number }
  gridConfig: { rowHeight: number; margin: [number, number] }
}

const getCardTypeInfo = () => ({ icon: '▭', label: '四角', color: 'bg-gray-100 border-gray-300' })

export const PreviewCard: React.FC<PreviewCardProps> = ({ cardType, position, gridConfig }) => {
  const cardInfo = getCardTypeInfo()
  const left = position.x * gridConfig.rowHeight
  const top = position.y * gridConfig.rowHeight
  const width = 2 * gridConfig.rowHeight
  const height = 2 * gridConfig.rowHeight
  return (
    <div
      className={`absolute pointer-events-none z-50 border-2 border-dashed rounded-lg ${cardInfo.color} opacity-70 flex items-center justify-center`}
      style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{cardInfo.icon}</div>
        <div className="text-xs font-medium text-gray-600">{cardInfo.label}</div>
      </div>
    </div>
  )
}
