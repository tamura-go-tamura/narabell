'use client'

import React from 'react'
import { Card } from '@/types/board'
import { TextCard } from './TextCard'
import { ImageCard } from './ImageCard'
import { ListCard } from './ListCard'

interface CardComponentProps {
  card: Card
  isSelected?: boolean
  className?: string
}

export const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  isSelected = false, 
  className = '' 
}) => {
  const cardStyle = {
    backgroundColor: card.style.backgroundColor,
    borderColor: card.style.borderColor,
    borderWidth: `${card.style.borderWidth}px`,
    borderStyle: card.style.borderStyle,
    borderRadius: `${card.style.borderRadius}px`,
    opacity: card.style.opacity,
    transform: `rotate(${card.style.rotation}deg)`,
    boxShadow: card.style.shadow.enabled 
      ? `${card.style.shadow.offsetX}px ${card.style.shadow.offsetY}px ${card.style.shadow.blur}px ${card.style.shadow.spread}px ${card.style.shadow.color}`
      : 'none'
  }

  const renderCardContent = () => {
    switch (card.type) {
      case 'text':
        return <TextCard card={card} />
      case 'image':
        return <ImageCard card={card} />
      case 'list':
        return <ListCard card={card} />
      case 'chart':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">Chart Card</div>
              <div className="text-xs text-gray-400">Coming Soon</div>
            </div>
          </div>
        )
      case 'link':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">🔗</div>
              <div className="text-sm">Link Card</div>
              <div className="text-xs text-gray-400">Coming Soon</div>
            </div>
          </div>
        )
      case 'calendar':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm">Calendar Card</div>
              <div className="text-xs text-gray-400">Coming Soon</div>
            </div>
          </div>
        )
      case 'shape':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">🔲</div>
              <div className="text-sm">Shape Card</div>
              <div className="text-xs text-gray-400">Coming Soon</div>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">❓</div>
              <div className="text-sm">Unknown Card</div>
            </div>
          </div>
        )
    }
  }

  return (
    <div
      className={`
        w-full h-full overflow-hidden transition-all duration-200
        hover:shadow-lg
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${className}
      `}
      style={cardStyle}
    >
      {renderCardContent()}
      
      {/* カードタイプインジケーター */}
      <div className="absolute top-1 right-1 text-xs opacity-50">
        {card.type === 'text' && '📝'}
        {card.type === 'image' && '🖼️'}
        {card.type === 'chart' && '📊'}
        {card.type === 'list' && '📋'}
        {card.type === 'link' && '🔗'}
        {card.type === 'calendar' && '📅'}
        {card.type === 'shape' && '🔲'}
      </div>
    </div>
  )
}
