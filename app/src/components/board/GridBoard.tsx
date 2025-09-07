'use client'

import React, { useCallback, useState, useEffect } from 'react'
import ReactGridLayout, { Layout } from 'react-grid-layout'
import { useBoardStore } from '@/stores/boardStore'
import { CardComponent } from '@/components/cards/CardComponent'
import { PreviewCard } from '@/components/cards/PreviewCard'
import { ToolPalette } from '@/components/board/ToolPalette'
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas'
import { InfiniteGrid } from '@/components/canvas/InfiniteGrid'
import { Card, GridPosition, CardType } from '@/types/board'
import styles from './GridBoard.module.css'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface GridBoardProps {
  className?: string
}

export const GridBoard: React.FC<GridBoardProps> = ({ className = '' }) => {
  const {
    currentBoard,
    selectedCardIds,
    isGridVisible,
    isSnapToGrid,
    moveCard,
    resizeCard,
    selectCard,
    clearSelection,
    createBoard,
    updateCard,
    addCard
  } = useBoardStore()

  const [dragPreview, setDragPreview] = useState<{
    cardType: CardType
    position: { x: number; y: number }
    isVisible: boolean
  } | null>(null)
  const [currentDragType, setCurrentDragType] = useState<CardType | null>(null)

  // カスタムイベントでドラッグ状態を監視
  useEffect(() => {
    const handleDragStart = (e: CustomEvent) => {
      setCurrentDragType(e.detail.cardType)
    }
    
    const handleDragEnd = () => {
      setCurrentDragType(null)
      setDragPreview(null)
    }

    window.addEventListener('cardDragStart', handleDragStart as EventListener)
    window.addEventListener('cardDragEnd', handleDragEnd)

    return () => {
      window.removeEventListener('cardDragStart', handleDragStart as EventListener)
      window.removeEventListener('cardDragEnd', handleDragEnd)
    }
  }, [])

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

  // 新しいボード作成ハンドラー
  const handleCreateBoard = useCallback(() => {
    const boardName = `ボード ${new Date().toLocaleDateString()}`
    createBoard(boardName)
  }, [createBoard])

  // グリッドレイアウトの設定 - 正方形グリッドにする
  const gridLayoutCols = 40  // カラム数を増やして細かいグリッドに
  const cellSize = currentBoard?.gridConfig.rowHeight || 40
  const gridLayoutWidth = gridLayoutCols * cellSize  // 幅 = カラム数 × セルサイズ

  // ドラッグオーバーハンドラー
  const handleDragOver = useCallback((e: React.DragEvent, canvasState?: { x: number; y: number; scale: number }) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'

    if (!currentBoard || !currentDragType) return

    // プレビュー位置を計算
    const rect = e.currentTarget.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    // ズーム・パンを考慮した座標変換
    if (canvasState) {
      x = (x - canvasState.x) / canvasState.scale
      y = (y - canvasState.y) / canvasState.scale
    }

    // グリッドセルに変換（react-grid-layoutの計算方法に合わせる）
    const colWidth = gridLayoutWidth / gridLayoutCols
    const cellHeight = currentBoard.gridConfig.rowHeight
    const gridX = Math.max(0, Math.floor(x / colWidth))
    const gridY = Math.max(0, Math.floor(y / cellHeight))

    console.log('DragOver Debug:', {
      rawX: x, rawY: y,
      colWidth, cellHeight,
      gridX, gridY,
      gridLayoutWidth, gridLayoutCols
    })

    setDragPreview({
      cardType: currentDragType,
      position: { x: gridX, y: gridY },
      isVisible: true
    })
  }, [currentBoard, currentDragType])

  // ドラッグリーブハンドラー
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 子要素への移動は無視
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragPreview(null)
    }
  }, [])

  // ドロップハンドラー
  const handleDrop = useCallback((e: React.DragEvent, canvasState?: { x: number; y: number; scale: number }) => {
    e.preventDefault()
    setDragPreview(null)
    
    if (!currentBoard) return

    try {
      const transferData = e.dataTransfer.getData('application/json')
      const data = JSON.parse(transferData)
      
      if (data.type === 'card-type') {
        // キャンバスの変換状態を考慮した座標計算
        const rect = e.currentTarget.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        
        // ズーム・パンを考慮した座標変換
        if (canvasState) {
          x = (x - canvasState.x) / canvasState.scale
          y = (y - canvasState.y) / canvasState.scale
        }
        
        // グリッドセルに変換（react-grid-layoutの計算方法に合わせる）
        const colWidth = gridLayoutWidth / gridLayoutCols
        const cellHeight = currentBoard.gridConfig.rowHeight
        const gridX = Math.floor(x / colWidth)
        const gridY = Math.floor(y / cellHeight)
        
        const position = {
          x: Math.max(0, gridX),
          y: Math.max(0, gridY),
          w: 2,
          h: 2,
          z: 0
        }
        
        // カードを追加
        addCard(data.cardType, position)
      }
    } catch (error) {
      console.error('ドロップエラー:', error)
    }
  }, [currentBoard, addCard])

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

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* ツールパレット */}
      <ToolPalette />
      
      {/* 無限キャンバス */}
      <InfiniteCanvas 
        className="w-full h-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 無限グリッド背景 */}
        {isGridVisible && (
          <InfiniteGrid 
            cellSize={currentBoard.gridConfig.rowHeight}
            strokeColor="rgba(59, 130, 246, 0.3)"
            opacity={0.6}
          />
        )}
        
        {/* ReactGridLayout - 大きなキャンバス内で動作 */}
        <div className={styles.infiniteWorkspace}>
          {/* ドラッグプレビュー */}
          {dragPreview && dragPreview.isVisible && (
            <PreviewCard
              cardType={dragPreview.cardType}
              position={dragPreview.position}
              gridConfig={currentBoard.gridConfig}
              gridLayoutWidth={gridLayoutWidth}
              gridLayoutCols={gridLayoutCols}
            />
          )}
          
          <ReactGridLayout
            className={styles.layout}
            layout={layout}
            cols={gridLayoutCols}
            rowHeight={currentBoard.gridConfig.rowHeight}
            margin={currentBoard.gridConfig.margin}
            containerPadding={currentBoard.gridConfig.containerPadding} // ストアの設定を使用
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            compactType={null}
            preventCollision={!isSnapToGrid}
            autoSize={false} // 自動サイズ調整をオフ
            allowOverlap={!isSnapToGrid}
            useCSSTransforms={true}
            resizeHandles={['se', 's', 'e']}
            width={gridLayoutWidth}
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
      </InfiniteCanvas>
    </div>
  )
}
