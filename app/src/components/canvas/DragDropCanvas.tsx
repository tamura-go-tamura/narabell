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
  onCardDragStart?: () => void
  onCardDragEnd?: () => void
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
  onCardDragStart,
  onCardDragEnd,
  children,
  className = ''
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })

  // センサー設定 - 即座にドラッグ開始するように調整
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 1, // 1px移動で即座に有効化
      delay: 0,    // 遅延なし
      tolerance: 0, // トレランスなし
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
    
    console.log('🎯 Card drag start:', active.id)
    
    // 状態をクリアしてからドラッグを開始
    setActiveId(active.id as string)
    setDragOffset({ x: 0, y: 0 })

    // ドラッグ開始位置のオフセットを記録
    if (active.rect.current.translated) {
      setDragOffset({
        x: active.rect.current.translated.left,
        y: active.rect.current.translated.top
      })
    }

    // カードドラッグ開始を通知
    onCardDragStart?.()
  }, [onCardDragStart])

  // ドラッグ中ハンドラー
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // ドラッグ中の処理（必要に応じて実装）
  }, [])

  // ドラッグ終了ハンドラー
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event
    
    console.log('🎯 Card drag end - cleaning up state:', active?.id)
    
    // 状態を即座にクリア
    setActiveId(null)
    setDragOffset({ x: 0, y: 0 })
    
    // カードドラッグ終了を通知
    onCardDragEnd?.()
    
    if (!active || !delta) {
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
      
      console.log('🎯 Moving card to new position:', {
        cardId,
        from: card.position,
        to: newGridPos,
        pixelDelta: delta
      })
      
      onCardMove(cardId, {
        x: newGridPos.x,
        y: newGridPos.y,
        w: card.size.w,
        h: card.size.h,
        z: card.position.z
      })
    }
  }, [cards, cellSize, onCardMove, pixelToGrid, onCardDragEnd])

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
      autoScroll={false} // 自動スクロールを無効化
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

      {/* ドラッグオーバーレイ - より滑らかな動作のために最適化 */}
      <DragOverlay 
        dropAnimation={null}
        style={{ cursor: 'grabbing' }}
      >
        {activeCard && (
          <div
            className="opacity-90 pointer-events-none"
            style={{
              width: activeCard.size.w * cellSize,
              height: activeCard.size.h * cellSize,
              transform: 'scale(1.05)',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))',
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
