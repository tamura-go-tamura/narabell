import React from 'react'

interface InfiniteGridProps {
  cellSize?: number
  strokeWidth?: number
  strokeColor?: string
  opacity?: number
  className?: string
  viewportX?: number
  viewportY?: number
  viewportScale?: number
}

export const InfiniteGrid: React.FC<InfiniteGridProps> = ({ 
  cellSize = 40,
  strokeWidth = 1,
  strokeColor = '#e0e0e0',
  opacity = 0.5,
  className = '',
  viewportX = 0,
  viewportY = 0,
  viewportScale = 1
}) => {
  // ズーム変換の外側にあるため、スケールを考慮したセルサイズを計算
  const scaledCellSize = cellSize * viewportScale
  
  // ビューポートの位置に基づいてグリッドのオフセットを計算
  const offsetX = (viewportX % scaledCellSize + scaledCellSize) % scaledCellSize
  const offsetY = (viewportY % scaledCellSize + scaledCellSize) % scaledCellSize

  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${strokeColor} ${strokeWidth}px, transparent ${strokeWidth}px),
            linear-gradient(to bottom, ${strokeColor} ${strokeWidth}px, transparent ${strokeWidth}px)
          `,
          backgroundSize: `${scaledCellSize}px ${scaledCellSize}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`
        }}
      />
    </div>
  )
}
