import React, { useRef, useCallback, useState, useEffect } from 'react'

interface InfiniteCanvasProps {
  children: React.ReactNode
  className?: string
  onDragOver?: (e: React.DragEvent, viewport?: { x: number; y: number; scale: number }) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, viewport?: { x: number; y: number; scale: number }) => void
  onViewportChange?: (viewport: { x: number; y: number; scale: number }) => void
}

interface ViewportState {
  x: number
  y: number
  scale: number
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ 
  children, 
  className = '', 
  onDragOver, 
  onDragLeave,
  onDrop,
  onViewportChange
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragViewportStart, setDragViewportStart] = useState({ x: 0, y: 0 })

  // マウスホイールでズーム
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    if (e.ctrlKey || e.metaKey) {
      // ズーム
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const delta = -e.deltaY * 0.001
      const newScale = Math.max(0.1, Math.min(3, viewport.scale * (1 + delta)))
      
      // マウス位置を中心にズーム
      const scaleDiff = newScale - viewport.scale
      const newX = viewport.x - (mouseX * scaleDiff)
      const newY = viewport.y - (mouseY * scaleDiff)

      const newViewport = { x: newX, y: newY, scale: newScale }
      setViewport(newViewport)
      onViewportChange?.(newViewport)
    } else {
      // パン
      const newX = viewport.x - e.deltaX
      const newY = viewport.y - e.deltaY
      const newViewport = { ...viewport, x: newX, y: newY }
      setViewport(newViewport)
      onViewportChange?.(newViewport)
    }
  }, [viewport])

  // マウスドラッグでパン
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // 中ボタンまたはAlt+左ボタン
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      setDragViewportStart({ x: viewport.x, y: viewport.y })
    }
  }, [viewport])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const newViewport = {
      ...viewport,
      x: dragViewportStart.x + deltaX,
      y: dragViewportStart.y + deltaY
    }
    setViewport(newViewport)
    onViewportChange?.(newViewport)
  }, [isDragging, dragStart, dragViewportStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // イベントリスナーの設定
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleMouseMove, handleMouseUp])

  // ドラッグオーバーハンドラー（ビューポート情報付き）
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(e, viewport)
    }
  }, [onDragOver, viewport])

  // ドロップハンドラー（ビューポート情報付き）
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e, viewport)
    }
  }, [onDrop, viewport])

  return (
    <div
      ref={canvasRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        {children}
      </div>
      
      {/* ズーム情報表示 */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  )
}
