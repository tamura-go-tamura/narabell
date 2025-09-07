'use client'

import React, { useCallback, useRef, useState } from 'react'
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

export interface TransformState {
  x: number
  y: number
  scale: number
}

interface ZoomPanCanvasProps {
  children: React.ReactNode
  onTransformChange?: (state: TransformState) => void
  onDragOver?: (e: React.DragEvent, state: TransformState, canvasPos: { x: number, y: number }) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, state: TransformState, canvasPos: { x: number, y: number }) => void
  className?: string
}

export const ZoomPanCanvas: React.FC<ZoomPanCanvasProps> = ({
  children,
  onTransformChange,
  onDragOver,
  onDragLeave,
  onDrop,
  className = ''
}) => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [currentTransformState, setCurrentTransformState] = useState<TransformState>({ x: 0, y: 0, scale: 1 })
  
  // 変換状態変更時のコールバック
  const handleTransformed = useCallback((ref: ReactZoomPanPinchRef, state: any) => {
    console.log('🔄 onTransformed called:', { ref, state })
    
    const transformState: TransformState = {
      x: state.positionX,
      y: state.positionY,
      scale: state.scale
    }
    
    console.log('🔄 Transform state:', transformState)
    
    // ローカル状態を更新
    setCurrentTransformState(transformState)
    
    // 外部コールバックを呼び出し
    if (onTransformChange) {
      onTransformChange(transformState)
    }
  }, [onTransformChange])

  // 現在の変換状態を取得する関数
  const getCurrentTransformState = useCallback((): TransformState => {
    // Method 1: transformRef.current.state を試す
    if (transformRef.current?.state) {
      const state = {
        x: transformRef.current.state.positionX,
        y: transformRef.current.state.positionY,
        scale: transformRef.current.state.scale
      }
      console.log('🔧 getCurrentTransformState (ref.state):', state)
      return state
    }
    
    // Method 2: transformRef.current.instance.transformState を試す
    if (transformRef.current?.instance?.transformState) {
      const state = {
        x: transformRef.current.instance.transformState.positionX,
        y: transformRef.current.instance.transformState.positionY,
        scale: transformRef.current.instance.transformState.scale
      }
      console.log('🔧 getCurrentTransformState (instance.transformState):', state)
      return state
    }
    
    // Method 3: ローカル状態を使用
    console.log('🔧 getCurrentTransformState (local state):', currentTransformState)
    return currentTransformState
  }, [currentTransformState])

  // スクリーン座標からキャンバス座標への変換
  const transformScreenToCanvas = useCallback((clientX: number, clientY: number): { x: number, y: number } => {
    const transformState = getCurrentTransformState()
    
    console.log('🔧 transformScreenToCanvas called:', {
      client: { x: clientX, y: clientY },
      transformState
    })
    
    // ドラッグイベントのターゲット要素を取得
    const dragTarget = document.querySelector('[data-testid="transform-wrapper"]') as HTMLElement
    
    if (dragTarget) {
      const targetRect = dragTarget.getBoundingClientRect()
      
      // スクリーン座標からキャンバス座標への変換
      // 理論: canvas = (screen - containerOffset - panOffset) / scale
      const canvasX = (clientX - targetRect.left - transformState.x) / transformState.scale
      const canvasY = (clientY - targetRect.top - transformState.y) / transformState.scale
      
      const result = { x: canvasX, y: canvasY }
      
      console.log('🔧 Coordinate conversion:', {
        targetRect: { left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height },
        client: { x: clientX, y: clientY },
        relative: { x: clientX - targetRect.left, y: clientY - targetRect.top },
        transformState,
        result
      })
      
      return result
    }
    
    // フォールバック: containerRef を使用
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const canvasX = (clientX - containerRect.left - transformState.x) / transformState.scale
      const canvasY = (clientY - containerRect.top - transformState.y) / transformState.scale
      
      const result = { x: canvasX, y: canvasY }
      
      console.log('🔧 Fallback coordinate conversion:', {
        containerRect,
        client: { x: clientX, y: clientY },
        transformState,
        result
      })
      
      return result
    }
    
    // 最後のフォールバック（エラー状態）
    console.error('🔧 No valid target found for coordinate conversion')
    return { x: clientX, y: clientY }
  }, [getCurrentTransformState])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    console.log('🔄 ZoomPanCanvas dragEnter')
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    console.log('🔄 ZoomPanCanvas dragLeave')
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false)
      onDragLeave?.(e)
    }
  }, [onDragLeave])

  // ドラッグオーバーハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    if (onDragOver) {
      const transformState = getCurrentTransformState()
      const canvasPos = transformScreenToCanvas(e.clientX, e.clientY)
      
      console.log('🔄 ZoomPanCanvas dragOver:', {
        clientX: e.clientX,
        clientY: e.clientY,
        transformState,
        canvasPos
      })
      
      onDragOver(e, transformState, canvasPos)
    }
  }, [onDragOver, getCurrentTransformState, transformScreenToCanvas])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    console.log('🔄 ZoomPanCanvas drop')
    setIsDragActive(false)
    
    if (onDrop) {
      const transformState = getCurrentTransformState()
      const canvasPos = transformScreenToCanvas(e.clientX, e.clientY)
      
      console.log('🔄 Drop coordinates:', {
        clientX: e.clientX,
        clientY: e.clientY,
        transformState,
        canvasPos,
        gridPos: { x: Math.floor(canvasPos.x / 40), y: Math.floor(canvasPos.y / 40) }
      })
      
      onDrop(e, transformState, canvasPos)
    }
  }, [onDrop, getCurrentTransformState, transformScreenToCanvas])

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full ${className}`} 
      data-testid="transform-wrapper"
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.1}
        maxScale={5}
        smooth={true}
        wheel={{ step: 0.1 }}
        onTransformed={handleTransformed}
        doubleClick={{ disabled: true }}
        pinch={{ step: 5 }}
        panning={{
          velocityDisabled: true,
          disabled: isDragActive,
        }}
      >
        <TransformComponent
          wrapperClass="w-full h-full"
          contentClass="w-full h-full"
        >
          <div
            className="w-full h-full relative min-h-screen"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ minWidth: '100vw', minHeight: '100vh' }}
          >
            {children}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}