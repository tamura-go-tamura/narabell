import { GridPosition } from '@/types/board'

export interface Position {
  x: number
  y: number
}

/**
 * ピクセル座標をグリッド座標に変換
 */
export const pixelToGrid = (pixel: Position, cellSize: number): GridPosition => {
  return {
    x: Math.floor(pixel.x / cellSize),
    y: Math.floor(pixel.y / cellSize),
    w: 2, // デフォルトサイズ
    h: 2,
    z: 0
  }
}

/**
 * グリッド座標をピクセル座標に変換
 */
export const gridToPixel = (grid: { x: number; y: number }, cellSize: number): Position => {
  return {
    x: grid.x * cellSize,
    y: grid.y * cellSize
  }
}

/**
 * グリッドにスナップする
 */
export const snapToGrid = (position: Position, cellSize: number): Position => {
  return {
    x: Math.round(position.x / cellSize) * cellSize,
    y: Math.round(position.y / cellSize) * cellSize
  }
}

/**
 * マウス座標をキャンバス座標に変換（ズーム・パンを考慮）
 */
export const screenToCanvas = (
  screenPos: Position,
  canvasRect: DOMRect,
  transform: { x: number; y: number; scale: number }
): Position => {
  const canvasX = screenPos.x - canvasRect.left
  const canvasY = screenPos.y - canvasRect.top
  
  // react-zoom-pan-pinchの座標変換
  const result = {
    x: (canvasX - transform.x) / transform.scale,
    y: (canvasY - transform.y) / transform.scale
  }
  
  console.log('🔧 screenToCanvas:', {
    screenPos,
    canvasRect: { left: canvasRect.left, top: canvasRect.top, width: canvasRect.width, height: canvasRect.height },
    transform,
    canvasRelative: { x: canvasX, y: canvasY },
    result
  })
  
  return result
}

/**
 * キャンバス座標をマウス座標に変換
 */
export const canvasToScreen = (
  canvasPos: Position,
  canvasRect: DOMRect,
  transform: { x: number; y: number; scale: number }
): Position => {
  return {
    x: canvasPos.x * transform.scale + transform.x + canvasRect.left,
    y: canvasPos.y * transform.scale + transform.y + canvasRect.top
  }
}

/**
 * グリッド座標を正規化（境界チェックなし、マイナス値も許可）
 */
export const normalizeGridPosition = (
  position: Position, 
  cellSize: number,
  defaultSize: { w: number; h: number } = { w: 2, h: 2 }
): GridPosition => {
  // より正確な整数変換のため、小さな数値誤差を考慮
  const EPSILON = 0.001
  
  const result = {
    x: Math.floor(position.x / cellSize + EPSILON), // マイナス値も許可
    y: Math.floor(position.y / cellSize + EPSILON), // マイナス値も許可
    w: defaultSize.w,
    h: defaultSize.h,
    z: 0
  }
  
  console.log('🔧 normalizeGridPosition:', {
    position,
    cellSize,
    normalized: {
      x: position.x / cellSize,
      y: position.y / cellSize
    },
    withEpsilon: {
      x: position.x / cellSize + EPSILON,
      y: position.y / cellSize + EPSILON
    },
    result
  })
  
  return result
}

/**
 * 矩形が重複しているかチェック
 */
export const isRectOverlapping = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number }
): boolean => {
  return !(
    rect1.x + rect1.w <= rect2.x ||
    rect2.x + rect2.w <= rect1.x ||
    rect1.y + rect1.h <= rect2.y ||
    rect2.y + rect2.h <= rect1.y
  )
}

/**
 * 座標が境界内にあるかチェック
 */
export const isPositionInBounds = (
  position: GridPosition,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): boolean => {
  return (
    position.x >= bounds.minX &&
    position.y >= bounds.minY &&
    position.x + position.w <= bounds.maxX &&
    position.y + position.h <= bounds.maxY
  )
}
