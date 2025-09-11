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

export interface CalculatePreviewPositionParams {
  mouseX: number
  mouseY: number
  cellSize: number
  transform: Transform
}

/**
 * マウス位置からプレビューカードの左上座標を計算
 * プレビューカードの中央がマウス位置と一致するようにする
 */
export function calculatePreviewPosition(params: CalculatePreviewPositionParams): Position {
  // TODO: TDDで実装する
  // 現在は失敗するダミー実装
  return { x: 0, y: 0 }
}
