'use client'

import React, { useCallback } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { useBoardStore } from '@/stores/boardStore'
import { CardComponent } from '@/components/cards/CardComponent'
import { ToolPalette } from '@/components/board/ToolPalette'
import { Card, GridPosition } from '@/types/board'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface GridBoardProps {
  className?: string
}

export const GridBoard: React.FC<GridBoardProps> = ({ className = '' }) => {
  const {
    currentBoard,
    selectedCardIds,
    isGridVisible,
    isSnapToGrid,
    zoom,
    moveCard,
    resizeCard,
    selectCard,
    clearSelection
  } = useBoardStore()

  // react-grid-layout用のレイアウト変換
  const convertToLayout = useCallback((cards: Card[]): Layout[] => {
    return cards.map(card => ({
      i: card.id,
      x: card.position.x,
      y: card.position.y,
      w: card.size.w,
      h: card.size.h,
      minW: card.size.minW || 1,
      minH: card.size.minH || 1,
      maxW: card.size.maxW || 12,
      maxH: card.size.maxH || 20
    }))
  }, [])

  // レイアウト変更ハンドラー
  const handleLayoutChange = useCallback((layout: Layout[]) => {
    if (!currentBoard) return

    layout.forEach(item => {
      const card = currentBoard.cards.find(c => c.id === item.i)
      if (!card) return

      const newPosition: GridPosition = {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        z: card.position.z
      }

      // 位置またはサイズが変更された場合のみ更新
      if (
        card.position.x !== newPosition.x ||
        card.position.y !== newPosition.y ||
        card.size.w !== newPosition.w ||
        card.size.h !== newPosition.h
      ) {
        moveCard(item.i, newPosition)
        resizeCard(item.i, { w: newPosition.w, h: newPosition.h })
      }
    })
  }, [currentBoard, moveCard, resizeCard])

  // カード選択ハンドラー
  const handleCardClick = useCallback((cardId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + クリックで複数選択
      const newSelection = selectedCardIds.includes(cardId)
        ? selectedCardIds.filter(id => id !== cardId)
        : [...selectedCardIds, cardId]
      
      useBoardStore.getState().selectMultipleCards(newSelection)
    } else {
      selectCard(cardId)
    }
  }, [selectedCardIds, selectCard])

  // 背景クリックで選択解除
  const handleBackgroundClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-2xl font-semibold mb-2">Narabellへようこそ</h2>
          <p>新しいボードを作成してください</p>
        </div>
      </div>
    )
  }

  const layout = convertToLayout(currentBoard.cards)

  return (
    <div 
      className={`relative w-full h-full overflow-auto ${className}`}
      onClick={handleBackgroundClick}
    >
      {/* ツールパレット */}
      <ToolPalette />
      
      {/* メインワークスペース */}
      <div 
        className="relative p-4"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          minHeight: '100vh'
        }}
      >
        {/* グリッド背景 */}
        {isGridVisible && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--grid-line, #e5e7eb) 1px, transparent 1px),
                linear-gradient(to bottom, var(--grid-line, #e5e7eb) 1px, transparent 1px)
              `,
              backgroundSize: `${currentBoard.gridConfig.rowHeight}px ${currentBoard.gridConfig.rowHeight}px`,
              opacity: 0.5
            }}
          />
        )}

        {/* React Grid Layout */}
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={currentBoard.gridConfig.breakpoints}
          cols={currentBoard.gridConfig.colsForBreakpoint}
          rowHeight={currentBoard.gridConfig.rowHeight}
          margin={currentBoard.gridConfig.margin}
          containerPadding={currentBoard.gridConfig.containerPadding}
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
          compactType={null}
          preventCollision={isSnapToGrid}
          autoSize={true}
        >
          {currentBoard.cards.map(card => (
            <div 
              key={card.id}
              className={`relative cursor-move ${
                selectedCardIds.includes(card.id) 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : ''
              }`}
              onClick={(e) => handleCardClick(card.id, e)}
            >
              <CardComponent 
                card={card}
                isSelected={selectedCardIds.includes(card.id)}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}
