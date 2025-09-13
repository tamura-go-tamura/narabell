'use client'

import React from 'react'
import { InfiniteGrid } from '@/components/canvas/InfiniteGrid'

// 最小構成: グリッド背景のみ
export const NewGridBoard: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-white select-none">
      <InfiniteGrid cellSize={40} />
    </div>
  )
}

export default NewGridBoard
