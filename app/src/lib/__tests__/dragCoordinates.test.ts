/**
 * ドラッグプレビュー座標計算のテスト
 * TDD方式で段階的に実装していく
 */

import { calculatePreviewPosition } from '../dragCoordinates'

describe('calculatePreviewPosition', () => {
  const CELL_SIZE = 40
  const CARD_WIDTH = CELL_SIZE * 2 // 2x2セル = 80px
  const CARD_HEIGHT = CELL_SIZE * 2 // 2x2セル = 80px

  describe('基本ケース (ズーム=1.0, パン=0,0)', () => {
    test('マウス位置100,100の時、プレビューの中央が100,100になる', () => {
      const result = calculatePreviewPosition({
        mouseX: 100,
        mouseY: 100,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 1 }
      })

      // プレビューカードの左上座標が60,60なら、中央が100,100になる
      // 左上 + カードサイズ/2 = 60 + 40 = 100
      expect(result).toEqual({
        x: 60,
        y: 60
      })
    })

    test('マウス位置200,150の時、プレビューの中央が200,150になる', () => {
      const result = calculatePreviewPosition({
        mouseX: 200,
        mouseY: 150,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 1 }
      })

      expect(result).toEqual({
        x: 160, // 200 - 40
        y: 110  // 150 - 40
      })
    })

    test('マウス位置0,0の時、プレビューの左上が-40,-40になる', () => {
      const result = calculatePreviewPosition({
        mouseX: 0,
        mouseY: 0,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 1 }
      })

      expect(result).toEqual({
        x: -40, // 0 - 40
        y: -40  // 0 - 40
      })
    })
  })
})
