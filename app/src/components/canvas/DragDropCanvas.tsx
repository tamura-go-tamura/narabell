'use client'

import React, { useCallback, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy
} from '@dnd-kit/core'
import { Card, GridPosition } from '@/types/board'
import { CardContainer } from './CardContainer'

interface Position {
  x: number
  y: number
}

interface DragDropCanvasProps {
  cards: Card[]
  selectedCardIds: string[]
  cellSize: number
  onCardMove: (cardId: string, gridPosition: GridPosition) => void
  onCardSelect: (cardId: string) => void
  onClearSelection: () => void
  children?: React.ReactNode
  className?: string
}

export const DragDropCanvas: React.FC<DragDropCanvasProps> = ({
  cards,
  selectedCardIds,
  cellSize,
  onCardMove,
  onCardSelect,
  onClearSelection,
  children,
  className = ''
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })

  // センサー設定
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px移動で有効化
    },
  })
  const sensors = useSensors(pointerSensor)

  // アクティブなカードを取得
  const activeCard = activeId ? cards.find(card => card.id === activeId) : null

  // 座標をグリッド座標に変換
  const pixelToGrid = useCallback((pixel: Position): GridPosition => {
    return {
      x: Math.floor(pixel.x / cellSize),
      y: Math.floor(pixel.y / cellSize),
      w: 2, // デフォルトサイズ
      h: 2,
      z: 0
    }
  }, [cellSize])

  // ドラッグ開始ハンドラー
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // ドラッグ開始位置のオフセットを記録
    if (active.rect.current.translated) {
      setDragOffset({
        x: active.rect.current.translated.left,
        y: active.rect.current.translated.top
      })
    }
  }, [])

  // ドラッグ中ハンドラー
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // ドラッグ中の処理（必要に応じて実装）
  }, [])

  // ドラッグ終了ハンドラー
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event
    
    if (!active || !delta) {
      setActiveId(null)
      return
    }

    const cardId = active.id as string
    const card = cards.find(c => c.id === cardId)
    
    if (card && onCardMove) {
      // 現在の位置に移動量を加算
      const currentPixelPos = {
        x: card.position.x * cellSize,
        y: card.position.y * cellSize
      }
      
      const newPixelPos = {
        x: currentPixelPos.x + delta.x,
        y: currentPixelPos.y + delta.y
      }
      
      const newGridPos = pixelToGrid(newPixelPos)
      onCardMove(cardId, {
        x: newGridPos.x,
        y: newGridPos.y,
        w: card.size.w,
        h: card.size.h,
        z: card.position.z
      })
    }

    setActiveId(null)
    setDragOffset({ x: 0, y: 0 })
  }, [cards, cellSize, onCardMove, pixelToGrid])

  // キャンバスクリック時の選択解除
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // カード要素以外をクリックした場合、選択解除
    if (e.target === e.currentTarget) {
      onClearSelection()
    }
  }, [onClearSelection])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div 
        className={`relative ${className}`}
        onClick={handleCanvasClick}
      >
        {children}
        
        {/* カードコンテナを描画 */}
        {cards.map((card) => (
          <CardContainer
            key={card.id}
            card={card}
            cellSize={cellSize}
            isSelected={selectedCardIds.includes(card.id)}
            onSelect={() => onCardSelect(card.id)}
          />
        ))}
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay dropAnimation={null}>
        {activeCard && (
          <div
            className="opacity-80"
            style={{
              width: activeCard.size.w * cellSize,
              height: activeCard.size.h * cellSize,
            }}
          >
            <CardContainer
              card={activeCard}
              cellSize={cellSize}
              isSelected={false}
              onSelect={() => {}}
              isDragOverlay={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export type { Position }
