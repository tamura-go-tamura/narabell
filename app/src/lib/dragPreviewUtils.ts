import { TransformState } from '@/components/canvas/ZoomPanCanvas'

export interface CanvasPosition {
  x: number
  y: number
}

export interface GridCoordinate {
  x: number
  y: number
}

export interface DragPosition {
  canvasPosition: CanvasPosition
  gridPosition: GridCoordinate
}

/**
 * 統一されたドラッグ位置計算システム
 * キャンバス相対のマウス位置から、プレビュー表示用のスクリーン座標と最終ドロップ用のグリッド位置を同時に計算
 * プレビューの中央が常にマウス位置と一致し、ドロップ位置もプレビュー位置と完全に一致することを保証
 */
export function calculateUnifiedDragPosition(
  canvasRelativeMouseX: number,
  canvasRelativeMouseY: number,
  baseCellSize: number,
  transformState: TransformState,
  snapToGrid: boolean = false
): DragPosition {
  const cardSize = baseCellSize * 2 // 2x2セル
  
  // Step 1: キャンバス相対のマウス位置をキャンバス座標系に変換（カードの中央位置として）
  const mouseCenterCanvasX = (canvasRelativeMouseX - transformState.x) / transformState.scale
  const mouseCenterCanvasY = (canvasRelativeMouseY - transformState.y) / transformState.scale
  
  // Step 2: グリッドスナップが有効な場合、カードの中央をグリッドセンターにスナップ
  let finalCenterCanvasX = mouseCenterCanvasX
  let finalCenterCanvasY = mouseCenterCanvasY
  
  if (snapToGrid) {
    // グリッド座標を計算（2x2セルのカード用）
    // 2x2セルの場合、カードの左上角が偶数グリッド座標になるようにスナップ
    const snapGridX = Math.round(mouseCenterCanvasX / baseCellSize - 1) * 2
    const snapGridY = Math.round(mouseCenterCanvasY / baseCellSize - 1) * 2
    
    // 2x2セルカードの中央座標（グリッド上での位置 + カードサイズの半分）
    finalCenterCanvasX = (snapGridX + 1) * baseCellSize
    finalCenterCanvasY = (snapGridY + 1) * baseCellSize
  }
  
  // Step 3: プレビュー表示用のスクリーン座標を計算（カードの中央座標）
  // カードの中央座標をスクリーン座標に変換
  const previewCenterScreenX = (finalCenterCanvasX * transformState.scale) + transformState.x
  const previewCenterScreenY = (finalCenterCanvasY * transformState.scale) + transformState.y
  
  const canvasPosition: CanvasPosition = {
    x: previewCenterScreenX,
    y: previewCenterScreenY
  }
  
  // Step 4: グリッド座標を計算（ドロップ位置決定用）
  // カードの左上角をキャンバス座標系で計算し、グリッド座標に変換
  const cardTopLeftCanvasX = finalCenterCanvasX - cardSize / 2
  const cardTopLeftCanvasY = finalCenterCanvasY - cardSize / 2
  
  const gridPosition: GridCoordinate = {
    x: Math.floor(cardTopLeftCanvasX / baseCellSize),
    y: Math.floor(cardTopLeftCanvasY / baseCellSize)
  }
  
  // デバッグログ
  if (process.env.NODE_ENV === 'development') {
    const mouseDiff = {
      x: previewCenterScreenX - canvasRelativeMouseX,
      y: previewCenterScreenY - canvasRelativeMouseY
    }
    
    console.log('🎯 Unified drag position calculation:', {
      canvasRelativeMouse: { x: canvasRelativeMouseX, y: canvasRelativeMouseY },
      mouseCanvasCenter: { x: mouseCenterCanvasX, y: mouseCenterCanvasY },
      finalCanvasCenter: { x: finalCenterCanvasX, y: finalCenterCanvasY },
      previewCenterScreen: { x: previewCenterScreenX, y: previewCenterScreenY },
      canvasPosition,
      cardTopLeftCanvas: { x: cardTopLeftCanvasX, y: cardTopLeftCanvasY },
      gridPosition,
      mouseDiff,
      snapToGrid,
      transformState,
      baseCellSize,
      cardSize
    })
  }
  
  return {
    canvasPosition,
    gridPosition
  }
}
