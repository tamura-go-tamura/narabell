'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useBoardStore } from '@/stores/boardStore'
import { ToolPalette } from '@/components/board/ToolPalette'
import { ZoomPanCanvas, TransformState } from '@/components/canvas/ZoomPanCanvas'
import { DragDropCanvas } from '@/components/canvas/DragDropCanvas'
import { InfiniteGrid } from '@/components/canvas/InfiniteGrid'
import { NewPreviewCard } from '@/components/canvas/NewPreviewCard'
import { Card, GridPosition, CardType } from '@/types/board'
import { normalizeGridPosition } from '@/lib/coordinates'

interface NewGridBoardProps {
  className?: string
}

export const NewGridBoard: React.FC<NewGridBoardProps> = ({ className = '' }) => {
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

  const [transformState, setTransformState] = useState<TransformState>({ x: 0, y: 0, scale: 1 })
  const [dragPreview, setDragPreview] = useState<{
    cardType: CardType
    position: { x: number; y: number }
    isVisible: boolean
  } | null>(null)
  const [currentDragType, setCurrentDragType] = useState<CardType | null>(null)
  const [isCardDragging, setIsCardDragging] = useState(false)

  const cellSize = currentBoard?.gridConfig.rowHeight || 40

  // カスタムイベントでドラッグ状態を監視
  useEffect(() => {
    const handleDragStart = (e: CustomEvent) => {
      console.log('🎯 Drag start event received:', e.detail)
      setCurrentDragType(e.detail.cardType)
    }
    
    const handleDragEnd = () => {
      console.log('🎯 Drag end event received')
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

  // 初期ボード作成
  useEffect(() => {
    if (!currentBoard) {
      console.log('🎯 Creating initial board')
      createBoard('初期ボード')
    }
  }, [currentBoard, createBoard])

  // 変換状態の変更ハンドラー
  const handleTransformChange = useCallback((state: TransformState) => {
    setTransformState(state)
  }, [])

  // カード移動ハンドラー
  const handleCardMove = useCallback((cardId: string, position: GridPosition) => {
    moveCard(cardId, position)
  }, [moveCard])

  // カード選択ハンドラー
  const handleCardSelect = useCallback((cardId: string) => {
    selectCard(cardId)
  }, [selectCard])

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

  // ドラッグオーバーハンドラー
  const handleDragOver = useCallback((e: React.DragEvent, transformState: TransformState, canvasPos: { x: number, y: number }) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'

    console.log('📍 handleDragOver called', { 
      currentDragType, 
      currentBoard: !!currentBoard,
      dragPreview: !!dragPreview,
      canvasPos
    })

    if (!currentBoard || !currentDragType) {
      console.log('📍 Skipping drag over - missing board or dragType')
      return
    }

    // ZoomPanCanvasから変換済みの座標を使用
    console.log('📍 Setting drag preview with canvas pos:', canvasPos)

    setDragPreview({
      cardType: currentDragType,
      position: canvasPos,
      isVisible: true
    })
  }, [currentBoard, currentDragType, dragPreview])

  // ドラッグリーブハンドラー
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragPreview(null)
    }
  }, [])

  // ドロップハンドラー（ZoomPanCanvasから変換済み座標を受け取る）
  const handleDrop = useCallback((e: React.DragEvent, transformState: TransformState, canvasPos: { x: number, y: number }) => {
    e.preventDefault()
    setDragPreview(null)
    
    console.log('Drop event triggered:', { currentBoard: !!currentBoard, canvasPos })
    
    if (!currentBoard) return

    try {
      const transferData = e.dataTransfer.getData('application/json')
      console.log('🎯 Transfer data:', transferData)
      const data = JSON.parse(transferData)
      console.log('🎯 Parsed data:', data)
      
      if (data.type === 'card-type') {
        // ZoomPanCanvasから既に変換済みの座標を使用
        console.log('🎯 Using canvas coordinates:', canvasPos)
        
        // グリッド座標に変換（マイナス座標も許可）
        const gridPosition = normalizeGridPosition(canvasPos, cellSize)
        console.log('🎯 Grid position:', gridPosition)
        
        // カードを追加
        console.log('🎯 Adding card:', data.cardType, gridPosition)
        addCard(data.cardType, gridPosition)
        console.log('🎯 Card added successfully')
      }
    } catch (error) {
      console.error('ドロップエラー:', error)
    }
  }, [currentBoard, addCard, cellSize])

  // カードドラッグ開始ハンドラー
  const handleCardDragStart = useCallback(() => {
    console.log('🎯 Card drag started - disabling pan')
    setIsCardDragging(true)
  }, [])

  // カードドラッグ終了ハンドラー
  const handleCardDragEnd = useCallback(() => {
    console.log('🎯 Card drag ended - enabling pan')
    setIsCardDragging(false)
  }, [])

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
          <div>Zoom: {Math.round(transformState.scale * 100)}%</div>
          <div>Pan: {Math.round(transformState.x)}, {Math.round(transformState.y)}</div>
          <div>Cards: {currentBoard.cards.length}</div>
          <div>Drag Type: {currentDragType || 'none'}</div>
          <div>Preview: {dragPreview ? 'visible' : 'hidden'}</div>
        </div>
      )}
      
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
      
      {/* メインキャンバス */}
      <ZoomPanCanvas
        onTransformChange={handleTransformChange}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        isCardDragging={isCardDragging}
        className="w-full h-full"
      >
        <DragDropCanvas
          cards={currentBoard.cards}
          selectedCardIds={selectedCardIds}
          cellSize={cellSize}
          onCardMove={handleCardMove}
          onCardSelect={handleCardSelect}
          onClearSelection={clearSelection}
          onCardDragStart={handleCardDragStart}
          onCardDragEnd={handleCardDragEnd}
          className="w-full h-full"
        />
      </ZoomPanCanvas>
      
      {/* ドラッグプレビュー - ZoomPanCanvasの外側に配置 */}
      {dragPreview && dragPreview.isVisible && (
        <>
          {console.log('🎨 Rendering preview:', dragPreview)}
          <NewPreviewCard
            cardType={dragPreview.cardType}
            position={{
              // キャンバス座標からスクリーン座標に変換
              // 数式: screen = (canvas * scale) + panOffset
              x: (dragPreview.position.x * transformState.scale) + transformState.x,
              y: (dragPreview.position.y * transformState.scale) + transformState.y
            }}
            cellSize={cellSize * transformState.scale}
          />
        </>
      )}
    </div>
  )
}
