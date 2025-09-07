'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useBoardStore } from '@/stores/boardStore'
import { ToolPalette } from '@/components/board/ToolPalette'
import { ZoomPanCanvas } from '@/components/canvas/ZoomPanCanvas'
import { DragDropCanvas } from '@/components/canvas/DragDropCanvas'
import { InfiniteGrid } from '@/components/canvas/InfiniteGrid'
import { CardType } from '@/types/board'
import { pixelToGrid, gridToPixel } from '@/lib/coordinates'
import type { TransformState } from '@/components/canvas/ZoomPanCanvas'

interface GridBoardNewProps {
  className?: string
}

export const GridBoardNew: React.FC<GridBoardNewProps> = ({ className = '' }) => {
  const {
    currentBoard,
    selectedCardIds,
    isGridVisible,
    isSnapToGrid,
    selectCard,
    clearSelection,
    createBoard,
    addCard
  } = useBoardStore()

  const [currentDragType, setCurrentDragType] = useState<CardType | null>(null)
  const [transformState, setTransformState] = useState<TransformState>({ x: 0, y: 0, scale: 1 })

  const cellSize = currentBoard?.gridConfig.rowHeight || 40

  // カスタムイベントでドラッグ状態を監視
  useEffect(() => {
    const handleDragStart = (e: CustomEvent) => {
      setCurrentDragType(e.detail.cardType)
    }
    
    const handleDragEnd = () => {
      setCurrentDragType(null)
    }

    window.addEventListener('cardDragStart', handleDragStart as EventListener)
    window.addEventListener('cardDragEnd', handleDragEnd)

    return () => {
      window.removeEventListener('cardDragStart', handleDragStart as EventListener)
      window.removeEventListener('cardDragEnd', handleDragEnd)
    }
  }, [])

  // ビューポート変更ハンドラー
  const handleTransformChange = useCallback((state: TransformState) => {
    setTransformState(state)
  }, [])

  // 新しいボード作成ハンドラー
  const handleCreateBoard = useCallback(() => {
    const boardName = `ボード ${new Date().toLocaleDateString()}`
    createBoard(boardName)
  }, [createBoard])

  // カード移動ハンドラー
  const handleCardMove = useCallback((cardId: string, pixelPosition: { x: number; y: number }) => {
    const gridPosition = pixelToGrid(pixelPosition, cellSize)
    // TODO: moveCard implementation
    console.log('Card moved:', cardId, gridPosition)
  }, [cellSize])

  // カードドロップハンドラー
  const handleCardDrop = useCallback((
    cardType: CardType, 
    pixelPosition: { x: number; y: number }
  ) => {
    const gridPosition = pixelToGrid(pixelPosition, cellSize)
    
    const position = {
      x: gridPosition.x,
      y: gridPosition.y,
      w: 2,
      h: 2,
      z: 0
    }
    
    addCard(cardType, position)
    setCurrentDragType(null)
  }, [addCard, cellSize, isSnapToGrid])

  // ドラッグオーバーハンドラー
  const handleDragOver = useCallback((e: React.DragEvent, transform: TransformState) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    
    if (!currentDragType) return
    
    // プレビュー表示のロジックをここに実装
    // TODO: Preview card implementation
  }, [currentDragType])

  // ドロップハンドラー
  const handleDrop = useCallback((e: React.DragEvent, transform: TransformState) => {
    e.preventDefault()
    
    if (!currentBoard || !currentDragType) return

    try {
      const transferData = e.dataTransfer.getData('application/json')
      const data = JSON.parse(transferData)
      
      if (data.type === 'card-type') {
        // マウス位置を取得
        const rect = e.currentTarget.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        
        // ズーム・パン変換を適用
        x = (x - transform.x) / transform.scale
        y = (y - transform.y) / transform.scale
        
        handleCardDrop(data.cardType, { x, y })
      }
    } catch (error) {
      console.error('ドロップエラー:', error)
    }
  }, [currentBoard, currentDragType, handleCardDrop])

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

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* ツールパレット */}
      <ToolPalette />
      
      {/* デバッグ情報表示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-72 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-50">
          <div>New Architecture</div>
          <div>Zoom: {Math.round(transformState.scale * 100)}%</div>
          <div>Position: {Math.round(transformState.x)}, {Math.round(transformState.y)}</div>
          <div>Cards: {currentBoard.cards.length}</div>
        </div>
      )}
      
      {/* ズーム・パンキャンバス */}
      <ZoomPanCanvas
        className="w-full h-full"
        onTransformChange={handleTransformChange}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* 無限グリッド背景 */}
        {isGridVisible && (
          <InfiniteGrid 
            cellSize={cellSize}
            strokeColor="rgba(59, 130, 246, 0.3)"
            opacity={0.6}
            viewportX={transformState.x}
            viewportY={transformState.y}
            viewportScale={transformState.scale}
          />
        )}
        
        {/* ドラッグ&ドロップキャンバス */}
        <DragDropCanvas
          cards={currentBoard.cards}
          selectedCardIds={selectedCardIds}
          cellSize={cellSize}
          onCardMove={handleCardMove}
          onCardSelect={selectCard}
          onClearSelection={clearSelection}
        />
      </ZoomPanCanvas>
    </div>
  )
}
