'use client'

import React, { useCallback } from 'react'
import ReactGridLayout, { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { useBoardStore } from '@/stores/boardStore'
import { CardComponent } from '@/components/cards/CardComponent'
import { ToolPalette } from '@/components/board/ToolPalette'
import { Card, GridPosition } from '@/types/board'
import styles from './GridBoard.module.css'
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
    clearSelection,
    createBoard,
    updateCard
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

  // シンプルなグリッド設定 - ReactGridLayoutに計算を任せる
  const gridWidth = 1200 // 固定幅

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

  // カードダブルクリックで編集モード
  const handleCardDoubleClick = useCallback((cardId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const card = currentBoard?.cards.find(c => c.id === cardId)
    if (!card) return
    
    // カードを編集モードに変更
    updateCard(cardId, { 
      metadata: { 
        ...card.metadata,
        isEditing: true 
      } 
    })
  }, [updateCard, currentBoard])

  // 背景クリックで選択解除
  const handleBackgroundClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // 新しいボード作成ハンドラー
  const handleCreateBoard = useCallback(() => {
    const boardName = `ボード ${new Date().toLocaleDateString()}`
    createBoard(boardName)
  }, [createBoard])

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-2xl font-semibold mb-2">Narabellへようこそ</h2>
          <p className="mb-6">新しいボードを作成してください</p>
          <button
            onClick={handleCreateBoard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            新しいボードを作成
          </button>
        </div>
      </div>
    )
  }

  const layout = convertToLayout(currentBoard.cards)
  
  // ReactGridLayoutのカラム幅を正確に計算
  const containerWidth = gridWidth - currentBoard.gridConfig.containerPadding[0] * 2
  const totalMarginWidth = currentBoard.gridConfig.margin[0] * (currentBoard.gridConfig.cols - 1)
  const colWidth = (containerWidth - totalMarginWidth) / currentBoard.gridConfig.cols

  // デバッグ用：グリッド計算値をコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.log('Grid Calculation:', {
      gridWidth,
      containerWidth,
      totalMarginWidth,
      colWidth,
      rowHeight: currentBoard.gridConfig.rowHeight,
      ratio: colWidth / currentBoard.gridConfig.rowHeight,
      backgroundSizeX: colWidth + currentBoard.gridConfig.margin[0],
      backgroundSizeY: currentBoard.gridConfig.rowHeight + currentBoard.gridConfig.margin[1]
    })
  }

  return (
    <div 
      className={`relative w-full h-full overflow-auto ${className}`}
      onClick={handleBackgroundClick}
    >
      {/* ツールパレット */}
      <ToolPalette />
      
      {/* メインワークスペース */}
      <div 
        className="relative min-h-full"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          minHeight: '100vh'
        }}
      >
        {/* ワークスペース背景 */}
        <div className="absolute inset-0 bg-gray-50" />
        
        {/* React Grid Layout with integrated background */}
        <div className={styles.gridContainer}>
          {/* グリッド背景 */}
          {isGridVisible && (
            <div 
              className={styles.gridBackground}
              style={{
                marginLeft: `${currentBoard.gridConfig.containerPadding[0]}px`,
                marginTop: `${currentBoard.gridConfig.containerPadding[1]}px`,
                marginRight: `${currentBoard.gridConfig.containerPadding[0]}px`,
                backgroundImage: `
                  linear-gradient(to right, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: `${colWidth}px ${currentBoard.gridConfig.rowHeight}px`,
              }}
            />
          )}
          
          <ReactGridLayout
            className={styles.layout}
            layout={layout}
            cols={currentBoard.gridConfig.cols}
            rowHeight={currentBoard.gridConfig.rowHeight}
            margin={currentBoard.gridConfig.margin}
            containerPadding={currentBoard.gridConfig.containerPadding}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            compactType={null}
            preventCollision={!isSnapToGrid}
            autoSize={true}
            allowOverlap={!isSnapToGrid}
            useCSSTransforms={true}
            resizeHandles={['se', 's', 'e']}
            width={gridWidth}
          >
          {currentBoard.cards.map(card => (
            <div 
              key={card.id}
              className={`
                relative group transition-all duration-200 ease-in-out
                ${selectedCardIds.includes(card.id) 
                  ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' 
                  : 'hover:shadow-md hover:ring-1 hover:ring-gray-300'
                }
                ${card.metadata.isEditing ? 'ring-2 ring-green-500 ring-offset-1' : ''}
              `}
              onClick={(e) => handleCardClick(card.id, e)}
              onDoubleClick={(e) => handleCardDoubleClick(card.id, e)}
              style={{ cursor: card.metadata.isEditing ? 'text' : 'move' }}
            >
              {/* ドラッグハンドル表示（ホバー時） */}
              <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <CardComponent 
                card={card}
                isSelected={selectedCardIds.includes(card.id)}
              />
            </div>
          ))}
        </ReactGridLayout>
        </div>
      </div>
    </div>
  )
}
