/**
 * ドラッグプレビュー座標計算ユーティリティ
 * TDD方式で段階的に実装
 */

export interface Position {
  x: number
  y: number
}

export interface Transform {
  x: number
  y: number
  scale: number
}

export interface GridPosition {
  x: number
  y: number
  w: number
  h: number
  z: number
}

export interface DragCalculationParams {
  mouseX: number
  mouseY: number
  cellSize: number
  transform: Transform
  snapToGrid?: boolean
}

export interface DragCalculationResult {
  previewPosition: Position
  gridPosition?: GridPosition // グリッドスナップ時のみ
}

/**
 * マウス位置からグリッド位置を計算（2x2カード専用）
 * プレビューとドロップで同じロジックを使用することで一貫性を保証
 */
export function calculateGridPosition(params: DragCalculationParams): GridPosition {
  const { mouseX, mouseY, cellSize, transform } = params
  
  // マウス位置をキャンバス座標に変換
  const mouseCanvasX = (mouseX - transform.x) / transform.scale
  const mouseCanvasY = (mouseY - transform.y) / transform.scale
  
  // カード中央がマウス位置になるように左上位置を計算
  const baseCardSize = cellSize * 2
  const cardLeftCanvasX = mouseCanvasX - baseCardSize / 2
  const cardLeftCanvasY = mouseCanvasY - baseCardSize / 2
  
  // 0.5 は正方向へ、-0.5 は負方向へ (round half away from zero) を実現するカスタム丸め
  const roundHalfAwayFromZero = (v: number): number => {
    if (v === 0) return 0
    const abs = Math.abs(v)
    const rounded = Math.floor(abs + 0.5)
    const result = (v < 0 ? -rounded : rounded)
    // -0 を避ける（テストで -1 期待ケース判定容易化）
    return Object.is(result, -0) ? 0 : result
  }
  
  // グリッド座標に変換（2x2カードなので cellSize * 2 単位）
  const gridX = roundHalfAwayFromZero(cardLeftCanvasX / baseCardSize)
  const gridY = roundHalfAwayFromZero(cardLeftCanvasY / baseCardSize)
  
  return {
    x: gridX,
    y: gridY,
    w: 2,
    h: 2,
    z: 0
  }
}

/**
 * グリッド位置からスクリーン座標でのプレビュー位置を計算
 */
export function gridPositionToScreenPosition(gridPos: GridPosition, cellSize: number, transform: Transform): Position {
  // グリッド位置をキャンバス座標に変換
  const canvasX = gridPos.x * cellSize * 2
  const canvasY = gridPos.y * cellSize * 2
  
  // キャンバス座標をスクリーン座標に変換
  const x = canvasX * transform.scale + transform.x
  const y = canvasY * transform.scale + transform.y
  
  return { x, y }
}

/**
 * ドラッグプレビューの座標とグリッド位置を一括計算
 * プレビューとドロップの一貫性を保証
 */
export function calculateDragPosition(params: DragCalculationParams): DragCalculationResult {
  const { mouseX, mouseY, cellSize, transform, snapToGrid = false } = params
  
  if (snapToGrid) {
    // グリッド位置を計算
    const gridPosition = calculateGridPosition(params)
    
    // グリッド位置からプレビュー位置を計算
    const previewPosition = gridPositionToScreenPosition(gridPosition, cellSize, transform)
    
    return {
      previewPosition,
      gridPosition
    }
  } else {
    // グリッドスナップ無効時は従来通り
    const baseCardSize = cellSize * 2
    const scaledCardSize = baseCardSize * transform.scale
    
    const previewPosition = {
      x: mouseX - scaledCardSize / 2,
      y: mouseY - scaledCardSize / 2
    }
    
    return { previewPosition }
  }
}
