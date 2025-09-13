'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useBoardStore } from '@/stores/boardStore'
import { ToolPalette } from '@/components/board/ToolPalette'
import { ZoomPanCanvas, TransformState } from '@/components/canvas/ZoomPanCanvas'
import { InfiniteGrid } from '@/components/canvas/InfiniteGrid'
import { NewPreviewCard } from '@/components/canvas/NewPreviewCard'
import { Card, GridPosition, CardType } from '@/types/board'
import { calculateDragPosition } from '@/lib/dragCoordinates'
import { CardComponent } from '@/components/cards/CardComponent'

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
    selectCard,
    clearSelection,
    createBoard,
    addCard
  } = useBoardStore()

  const [transformState, setTransformState] = useState<TransformState>({ x: 0, y: 0, scale: 1 })
  const [dragPreview, setDragPreview] = useState<{
    cardType: CardType
    position: { x: number; y: number }
    isVisible: boolean
    snapToGrid: boolean
  } | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [dragSourceType, setDragSourceType] = useState<'palette' | 'existing-card' | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragPreviewRef = useRef(dragPreview)

  const cellSize = currentBoard?.gridConfig.rowHeight || 40

  // dragPreviewRef を更新
  useEffect(() => {
    dragPreviewRef.current = dragPreview
  }, [dragPreview])

  // ドラッグ状態の監視（位置更新はhandleDragOverで処理）
  useEffect(() => {
    console.log('🎯 Drag state effect:', { isDragging, dragPreview: !!dragPreview })
  }, [isDragging, dragPreview]) // dragPreview?.snapToGridを削除

  // パレットからのドラッグイベント監視
  useEffect(() => {
    const handlePaletteDragStart = (e: CustomEvent) => {
      console.log('🎯 Palette drag start:', e.detail)
      setIsDragging(true)
      setDragSourceType('palette')
      setDragPreview({
        cardType: 'shape',
        position: { x: 0, y: 0 },
        isVisible: false,
        snapToGrid: isSnapToGrid
      })
      console.log('🎯 Drag preview state set:', {
        cardType: e.detail.cardType,
        snapToGrid: isSnapToGrid
      })
    }
    
    const handleDragEnd = () => {
      console.log('🎯 Drag end')
      setIsDragging(false)
      setDragSourceType(null)
      setDragPreview(null)
    }

    console.log('🎯 Adding drag event listeners')
    window.addEventListener('cardDragStart', handlePaletteDragStart as EventListener)
    window.addEventListener('cardDragEnd', handleDragEnd)

    return () => {
      console.log('🎯 Removing drag event listeners')
      window.removeEventListener('cardDragStart', handlePaletteDragStart as EventListener)
      window.removeEventListener('cardDragEnd', handleDragEnd)
    }
  }, [isSnapToGrid])

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

  // 新しいボード作成ハンドラー
  const handleCreateBoard = useCallback(() => {
    const boardName = `ボード ${new Date().toLocaleDateString()}`
    createBoard(boardName)
  }, [createBoard])

  // ドラッグオーバーハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'

    if (!isDragging) return

    // リアルタイムでプレビュー位置を更新
    const currentDragPreview = dragPreviewRef.current
    if (currentDragPreview && canvasRef.current) {
      // 新しいTDD実装の統一座標計算を使用
      const dragResult = calculateDragPosition({
        mouseX: e.clientX,
        mouseY: e.clientY,
        cellSize,
        transform: transformState,
        snapToGrid: isSnapToGrid
      })

      console.log('🎯 DragOver - New unified API:', {
        mouse: { x: e.clientX, y: e.clientY },
        previewPos: dragResult.previewPosition,
        gridPos: dragResult.gridPosition,
        transformState,
        isSnapToGrid
      })

      setDragPreview(prev => prev ? {
        ...prev,
        position: dragResult.previewPosition,
        isVisible: true,
        snapToGrid: isSnapToGrid
      } : null)
    } else {
      setDragPreview(prev => prev ? { ...prev, isVisible: true } : null)
    }
  }, [isDragging, cellSize, transformState])

  // ドラッグリーブハンドラー
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragPreview(prev => prev ? { ...prev, isVisible: false } : null)
    }
  }, [])

  // ドロップハンドラー
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    if (!currentBoard || !dragPreview || !canvasRef.current) return

    try {
      const transferData = e.dataTransfer.getData('application/json')
      const data = JSON.parse(transferData)
      
      // 新しい統一座標計算APIを使用
      const dragResult = calculateDragPosition({
        mouseX: e.clientX,
        mouseY: e.clientY,
        cellSize,
        transform: transformState,
        snapToGrid: isSnapToGrid
      })
      
      if (data.type === 'card-type') {
        let gridPosition: GridPosition
        
        if (isSnapToGrid && dragResult.gridPosition) {
          // グリッドスナップ有効時：統一APIからグリッド位置を直接使用
          gridPosition = dragResult.gridPosition
          
          console.log('🎯 Adding card (Grid Snap - Unified API):', {
            cardType: data.cardType, 
            previewPos: dragResult.previewPosition,
            gridPosition
          })
        } else {
          // グリッドスナップ無効時：プレビュー位置からキャンバス座標に変換してグリッド位置を計算
          const canvasX = (dragResult.previewPosition.x - transformState.x) / transformState.scale
          const canvasY = (dragResult.previewPosition.y - transformState.y) / transformState.scale
          const gridX = Math.floor(canvasX / cellSize)
          const gridY = Math.floor(canvasY / cellSize)
          
          gridPosition = {
            x: gridX,
            y: gridY,
            w: 2,
            h: 2,
            z: 0
          }
          
          console.log('🎯 Adding card (Free Position - Unified API):', {
            cardType: data.cardType, 
            previewPos: dragResult.previewPosition,
            canvasPos: { x: canvasX, y: canvasY },
            gridPosition
          })
        }
        
        addCard(data.cardType, gridPosition)
        
      } else if (data.type === 'existing-card') {
        // 既存カードの移動用：プレビュー位置からキャンバス座標に変換
        const canvasX = (dragResult.previewPosition.x - transformState.x) / transformState.scale
        const canvasY = (dragResult.previewPosition.y - transformState.y) / transformState.scale
        const gridX = Math.floor(canvasX / cellSize)
        const gridY = Math.floor(canvasY / cellSize)
        
        const card = currentBoard.cards.find(c => c.id === data.cardId)
        if (card) {
          const gridPosition: GridPosition = {
            x: gridX,
            y: gridY,
            w: card.size.w,
            h: card.size.h,
            z: card.position.z
          }
          
          console.log('🎯 Moving card (Unified API):', data.cardId, gridPosition)
          moveCard(data.cardId, gridPosition)
        }
      }
    } catch (error) {
      console.error('ドロップエラー:', error)
    }
  }, [currentBoard, dragPreview, cellSize, transformState, addCard, moveCard])

  // カード選択ハンドラー
  const handleCardSelect = useCallback((cardId: string) => {
    selectCard(cardId)
  }, [selectCard])

  // カードドラッグ開始ハンドラー（既存カード用）
  const handleCardDragStart = useCallback((e: React.DragEvent, card: Card) => {
    console.log('🎯 Card drag start:', card.id)
    
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'existing-card',
      cardId: card.id,
      cardType: card.type
    }))
    e.dataTransfer.effectAllowed = 'move'
    
    setIsDragging(true)
    setDragSourceType('existing-card')
    setDragPreview({
      cardType: card.type,
      position: { x: 0, y: 0 },
      isVisible: false,
      snapToGrid: false // 既存カードは自由移動
    })
  }, [])

  // キャンバスクリック時の選択解除
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }, [clearSelection])

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
          <div>Dragging: {isDragging ? dragSourceType : 'none'}</div>
          <div>Preview: {dragPreview?.isVisible ? 'visible' : 'hidden'}</div>
          <div>Snap: {dragPreview?.snapToGrid ? 'ON' : 'OFF'}</div>
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
        className="w-full h-full"
      >
        <div 
          ref={canvasRef}
          className="w-full h-full relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
        >
          {/* カードを描画 */}
          {currentBoard.cards.map((card) => (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => handleCardDragStart(e, card)}
              className="absolute cursor-move"
              style={{
                left: card.position.x * cellSize,
                top: card.position.y * cellSize,
                width: card.size.w * cellSize,
                height: card.size.h * cellSize,
                zIndex: card.position.z
              }}
              onClick={() => handleCardSelect(card.id)}
            >
              <CardComponent
                card={card}
                isSelected={selectedCardIds.includes(card.id)}
              />
            </div>
          ))}
        </div>
      </ZoomPanCanvas>
      
      {/* ドラッグプレビュー */}
      {dragPreview && dragPreview.isVisible && (() => {
        console.log('🎯 Rendering preview (TDD):', {
          dragPreview,
          leftTopPosition: dragPreview.position,
          cellSize,
          transformState
        })
        return (
          <NewPreviewCard
            cardType={'shape'}
            position={dragPreview.position}
            cellSize={cellSize}
            scale={transformState.scale}
            snapToGrid={false}
          />
        )
      })()}
    </div>
  )
}
