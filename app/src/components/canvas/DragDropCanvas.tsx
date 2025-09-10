'use client'

import React, { useCallback, useState, useEffect } from 'react'
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
import { CardComponent } from '@/components/cards/CardComponent'
import { TransformState } from './ZoomPanCanvas'

interface Position {
  x: number
  y: number
}

interface DragDropCanvasProps {
  cards: Card[]
  selectedCardIds: string[]
  cellSize: number
  transformState?: TransformState
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
  transformState = { x: 0, y: 0, scale: 1 },
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
  const [isDragPreviewActive, setIsDragPreviewActive] = useState(false)

  // センサー設定 - より安定した設定に調整
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // 5px移動で有効化（がたつき防止）
      delay: 0,    // 遅延なし
      tolerance: 5, // 5pxの許容範囲
    },
  })
  const sensors = useSensors(pointerSensor)

  // アクティブなカードを取得
  const activeCard = activeId ? cards.find(card => card.id === activeId) : null

  // カードリストが変更された時のクリーンアップ
  useEffect(() => {
    if (activeId && !cards.find(card => card.id === activeId)) {
      console.log('🎯 Active card no longer exists, clearing state:', activeId)
      setActiveId(null)
      setDragOffset({ x: 0, y: 0 })
    }
  }, [cards, activeId])

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
    const cardId = active.id as string
    const card = cards.find(c => c.id === cardId)
    
    console.log('🎯 Card drag start:', {
      activeId: cardId,
      existingActiveId: activeId,
      cardExists: !!card,
      totalCards: cards.length
    })
    
    // 以前のドラッグ状態をクリアしてから新しいドラッグを開始
    if (activeId && activeId !== cardId) {
      console.log('🎯 Clearing previous drag state:', activeId)
    }
    
    setActiveId(cardId)
    setDragOffset({ x: 0, y: 0 })
    setIsDragPreviewActive(true)

    // カードタイプを使ってツールパレットと同じプレビューシステムを使用
    if (card) {
      // カスタムイベントを発行してツールパレットと同じプレビューを有効化
      const dragEvent = new CustomEvent('cardDragStart', {
        detail: { 
          cardType: card.type,
          isDraggingExistingCard: true,
          transformState
        }
      })
      window.dispatchEvent(dragEvent)
    }

    // カードドラッグ開始を通知
    onCardDragStart?.()
  }, [onCardDragStart, activeId, cards])

  // ドラッグ中ハンドラー
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // ドラッグ中の処理（必要に応じて実装）
  }, [])

  // ドラッグ終了ハンドラー
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event
    
    console.log('🎯 Card drag end - processing:', {
      activeId: active?.id,
      delta,
      hasCard: !!active
    })

    // プレビュー状態をクリア
    setIsDragPreviewActive(false)
    
    // カスタムイベントを発行してプレビューを無効化
    const dragEndEvent = new CustomEvent('cardDragEnd')
    window.dispatchEvent(dragEndEvent)
    
    // カードドラッグ終了を通知
    onCardDragEnd?.()
    
    if (!active) {
      // activeが無い場合のみ状態をクリア
      setActiveId(null)
      setDragOffset({ x: 0, y: 0 })
      return
    }

    const cardId = active.id as string
    const card = cards.find(c => c.id === cardId)
    
    if (card && onCardMove && delta) {
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

    // カードの移動処理完了後に状態をクリア（少し遅延を入れる）
    setTimeout(() => {
      console.log('🎯 Clearing drag state after delay')
      setActiveId(null)
      setDragOffset({ x: 0, y: 0 })
      setIsDragPreviewActive(false)
    }, 50) // 50ms後にクリア
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
        draggable: {
          measure: () => ({ 
            width: 0, 
            height: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          })
        }
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

      {/* DragOverlayは座標変換の問題があるため使用しない */}
    </DndContext>
  )
}

export type { Position }
