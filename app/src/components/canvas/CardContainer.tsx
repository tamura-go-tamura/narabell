'use client'

import React, { useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Card } from '@/types/board'
import { CardComponent } from '@/components/cards/CardComponent'

interface CardContainerProps {
  card: Card
  cellSize: number
  isSelected: boolean
  onSelect?: () => void
  onCardDoubleClick?: (cardId: string, event: React.MouseEvent) => void
  isDragOverlay?: boolean
  className?: string
}

export const CardContainer: React.FC<CardContainerProps> = ({
  card,
  cellSize,
  isSelected,
  onSelect,
  onCardDoubleClick,
  isDragOverlay = false,
  className = ''
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: card.id,
    disabled: isDragOverlay, // ドラッグオーバーレイ時は無効化
  })

  // 位置とサイズをピクセル値に変換
  const left = card.position.x * cellSize
  const top = card.position.y * cellSize
  const width = card.size.w * cellSize
  const height = card.size.h * cellSize

  // ドラッグ中の変換を適用
  const dragTransform = transform ? {
    x: transform.x,
    y: transform.y,
  } : { x: 0, y: 0 }

  // クリックハンドラー
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect?.()
  }, [onSelect])

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onCardDoubleClick?.(card.id, event)
  }, [card.id, onCardDoubleClick])

  return (
    <div
      ref={setNodeRef}
      className={`
        absolute group transition-all duration-200 ease-in-out
        ${isDragging ? 'z-50 opacity-50' : 'z-auto'}
        ${isSelected 
          ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' 
          : 'hover:shadow-md hover:ring-1 hover:ring-gray-300'
        }
        ${card.metadata.isEditing ? 'ring-2 ring-green-500 ring-offset-1' : ''}
        ${className}
      `}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)`,
        zIndex: card.position.z,
        cursor: card.metadata.isEditing ? 'text' : 'move'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      {...attributes}
      {...listeners}
    >
      {/* ドラッグハンドル表示（ホバー時） */}
      <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      
      {/* デバッグ情報（開発中のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black text-white text-xs p-1 opacity-70 pointer-events-none z-10">
          {card.position.x},{card.position.y}
        </div>
      )}
      
      <CardComponent 
        card={card}
        isSelected={isSelected}
      />
    </div>
  )
}
