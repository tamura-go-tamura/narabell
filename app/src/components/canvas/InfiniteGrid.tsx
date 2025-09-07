import React from 'react'

interface InfiniteGridProps {
  cellSize?: number
  strokeWidth?: number
  strokeColor?: string
  opacity?: number
  className?: string
}

export const InfiniteGrid: React.FC<InfiniteGridProps> = ({ 
  cellSize = 40,  // boardStoreのrowHeightと一致
  strokeWidth = 1,
  strokeColor = '#e0e0e0',
  opacity = 0.5,
  className = ''
}) => {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, ${strokeColor} ${strokeWidth}px, transparent ${strokeWidth}px),
          linear-gradient(to bottom, ${strokeColor} ${strokeWidth}px, transparent ${strokeWidth}px)
        `,
        backgroundSize: `${cellSize}px ${cellSize}px`,
        opacity
      }}
    />
  )
}
