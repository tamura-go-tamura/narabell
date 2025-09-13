/**
 * ドラッグプレビュー座標計算のテスト
 * TDD方式で段階的に実装していく
 */

import { calculateDragPosition, calculateGridPosition, gridPositionToScreenPosition } from '../dragCoordinates'

describe('dragCoordinates unified API', () => {
  const CELL_SIZE = 40

  describe('新しい統一API: calculateDragPosition', () => {
    test('グリッドスナップ無効時、プレビュー位置のみ返される', () => {
      const result = calculateDragPosition({
        mouseX: 100,
        mouseY: 100,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 1 },
        snapToGrid: false
      })

      expect(result.previewPosition).toEqual({
        x: 60, // 100 - 40
        y: 60  // 100 - 40
      })
      expect(result.gridPosition).toBeUndefined()
    })

    test('グリッドスナップ有効時、プレビュー位置とグリッド位置の両方が返される', () => {
      const result = calculateDragPosition({
        mouseX: 75,
        mouseY: 85,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 1 },
        snapToGrid: true
      })

      expect(result.previewPosition).toEqual({
        x: 0,
        y: 80
      })
      expect(result.gridPosition).toEqual({
        x: 0,
        y: 1,
        w: 2,
        h: 2,
        z: 0
      })
    })

    test('スケール2.0 + グリッドスナップ有効時の一貫性', () => {
      const result = calculateDragPosition({
        mouseX: 200,
        mouseY: 200,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 2.0 },
        snapToGrid: true
      })

      // プレビュー位置からグリッド位置を逆算して検証
      expect(result.gridPosition).toBeDefined()
      if (result.gridPosition) {
        const reconstructedPreview = gridPositionToScreenPosition(
          result.gridPosition,
          CELL_SIZE,
          { x: 0, y: 0, scale: 2.0 }
        )
        expect(result.previewPosition).toEqual(reconstructedPreview)
      }
    })
  })

  describe('calculateGridPosition', () => {
    test('マウス位置からグリッド位置を正しく計算', () => {
      const result = calculateGridPosition({
        mouseX: 75,
        mouseY: 85,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 1 }
      })

      expect(result).toEqual({
        x: 0,
        y: 1,
        w: 2,
        h: 2,
        z: 0
      })
    })

    test('スケール状態でのグリッド位置計算', () => {
      const result = calculateGridPosition({
        mouseX: 400,
        mouseY: 400,
        cellSize: CELL_SIZE,
        transform: { x: 0, y: 0, scale: 2.0 }
      })

      expect(result).toEqual({
        x: 2,
        y: 2,
        w: 2,
        h: 2,
        z: 0
      })
    })
  })

  describe('gridPositionToScreenPosition', () => {
    test('グリッド位置からスクリーン座標への変換', () => {
      const result = gridPositionToScreenPosition(
        { x: 1, y: 1, w: 2, h: 2, z: 0 },
        CELL_SIZE,
        { x: 0, y: 0, scale: 1 }
      )

      expect(result).toEqual({
        x: 80, // 1 * 40 * 2
        y: 80  // 1 * 40 * 2
      })
    })

    test('スケール + パンでのグリッド位置からスクリーン座標への変換', () => {
      const result = gridPositionToScreenPosition(
        { x: 1, y: 1, w: 2, h: 2, z: 0 },
        CELL_SIZE,
        { x: 50, y: 30, scale: 1.5 }
      )

      expect(result).toEqual({
        x: 170, // 80 * 1.5 + 50 = 120 + 50
        y: 150  // 80 * 1.5 + 30 = 120 + 30
      })
    })
  })

  describe('プレビュー=配置 一貫性 (ズーム/パン/スナップ)', () => {
    const CELL = CELL_SIZE
    const cases = [
      { name: 'scale=1, pan=0', mouse: { x: 75, y: 85 }, transform: { x: 0, y: 0, scale: 1 } },
      { name: 'scale=2, pan=0', mouse: { x: 200, y: 200 }, transform: { x: 0, y: 0, scale: 2 } },
      { name: 'scale=1, pan=(100,50)', mouse: { x: 250, y: 240 }, transform: { x: 100, y: 50, scale: 1 } },
      { name: 'scale=1.5, pan=(-60,30)', mouse: { x: 333, y: 271 }, transform: { x: -60, y: 30, scale: 1.5 } },
      { name: 'scale=0.75, pan=(120,-40)', mouse: { x: 500, y: 301 }, transform: { x: 120, y: -40, scale: 0.75 } },
    ] as const

    test.each(cases)('snap=true で preview と placement が一致: %s', ({ name, mouse, transform }) => {
      const result = calculateDragPosition({
        mouseX: mouse.x,
        mouseY: mouse.y,
        cellSize: CELL,
        transform,
        snapToGrid: true,
      })

      expect(result.gridPosition).toBeDefined()
      const derived = gridPositionToScreenPosition(result.gridPosition!, CELL, transform)

      // プレビュー表示座標 = スナップ後の表示座標
      expect(result.previewPosition.x).toBeCloseTo(derived.x, 6)
      expect(result.previewPosition.y).toBeCloseTo(derived.y, 6)

      // プレビュー座標から逆算したグリッドが一致（left-top anchor, round ベース）
      const canvasX = (result.previewPosition.x - transform.x) / transform.scale
      const canvasY = (result.previewPosition.y - transform.y) / transform.scale
      const base = CELL * 2
      const gridX = Math.round(canvasX / base)
      const gridY = Math.round(canvasY / base)

      expect(gridX).toBe(result.gridPosition!.x)
      expect(gridY).toBe(result.gridPosition!.y)
    })
  })

  // 新規: 端数境界の丸めルール（0.5タイ）
  describe('境界ケース: 0.5 タイブレーク', () => {
    const transform = { x: 0, y: 0, scale: 1 }
    const base = CELL_SIZE * 2

    test('ちょうどセル境界 + 0.5 セルで round の動作確認 (x)', () => {
      // キャンバス左上が 0.5*base の位置 -> round で 1 へ
      const mouseX = (base * 0.5) + (base / 2) // leftTop = mouse - base/2 = 0.5*base
      const mouseY = (base * 0.5) + (base / 2)
      const { gridPosition, previewPosition } = calculateDragPosition({
        mouseX,
        mouseY,
        cellSize: CELL_SIZE,
        transform,
        snapToGrid: true,
      })
      expect(gridPosition).toBeDefined()
      expect(gridPosition!.x).toBe(1)
      expect(gridPosition!.y).toBe(1)

      const derived = gridPositionToScreenPosition(gridPosition!, CELL_SIZE, transform)
      expect(previewPosition.x).toBeCloseTo(derived.x, 6)
      expect(previewPosition.y).toBeCloseTo(derived.y, 6)
    })

    test('負座標の 0.5 タイブレーク（round 振る舞い）', () => {
      // leftTop = -0.5*base -> round(-0.5) = -1
      const mouseX = (-base * 0.5) + (base / 2)
      const mouseY = (-base * 0.5) + (base / 2)
      const { gridPosition } = calculateDragPosition({
        mouseX,
        mouseY,
        cellSize: CELL_SIZE,
        transform,
        snapToGrid: true,
      })
      expect(gridPosition).toBeDefined()
      expect(gridPosition!.x).toBe(-1)
      expect(gridPosition!.y).toBe(-1)
    })
  })

  // MEMO: 今後の拡張
  // - 可変カードサイズ (1x1, 3x2, etc.) に対応した calculateGridPositionV2 の追加とテスト
  // - 極端なズーム/パン、非常に大きい/負の座標での安定性テスト
  // - プレビュー/配置一貫性のプロパティベーステスト（ランダムケース大量）

  describe('追加境界テスト / Edge Cases', () => {
    const CELL_SIZE = 40
    const transformCases = [
      { name: '極端ズーム: scale=0.1', transform: { x: 0, y: 0, scale: 0.1 }, mouse: { x: 500, y: 400 } },
      { name: '極端ズーム: scale=4.0', transform: { x: 0, y: 0, scale: 4.0 }, mouse: { x: 1200, y: 900 } },
      { name: '大きなパン: (5000, -3000)', transform: { x: 5000, y: -3000, scale: 1 }, mouse: { x: 5100, y: -2900 } },
      { name: 'ズーム+大パン: scale=2, pan=(-4000, 2500)', transform: { x: -4000, y: 2500, scale: 2 }, mouse: { x: -3500, y: 3000 } },
      { name: '負座標ズーム: scale=0.5, pan=(-800,-800)', transform: { x: -800, y: -800, scale: 0.5 }, mouse: { x: -200, y: -100 } },
    ] as const

    test.each(transformCases)('%s - snap=true プレビュー=配置一致', ({ transform, mouse }) => {
      const result = calculateDragPosition({
        mouseX: mouse.x,
        mouseY: mouse.y,
        cellSize: CELL_SIZE,
        transform,
        snapToGrid: true,
      })
      expect(result.gridPosition).toBeDefined()
      const derived = gridPositionToScreenPosition(result.gridPosition!, CELL_SIZE, transform)
      expect(result.previewPosition.x).toBeCloseTo(derived.x, 6)
      expect(result.previewPosition.y).toBeCloseTo(derived.y, 6)
    })

    test.each(transformCases)('%s - snap=false 中央一致', ({ transform, mouse }) => {
      const result = calculateDragPosition({
        mouseX: mouse.x,
        mouseY: mouse.y,
        cellSize: CELL_SIZE,
        transform,
        snapToGrid: false,
      })
      const baseCardSize = CELL_SIZE * 2 * transform.scale
      expect(result.previewPosition.x + baseCardSize / 2).toBeCloseTo(mouse.x, 6)
      expect(result.previewPosition.y + baseCardSize / 2).toBeCloseTo(mouse.y, 6)
    })

    test('スナップ境界: グリッド境界線(80単位) ぴったり', () => {
      const transform = { x: 0, y: 0, scale: 1 }
      // 左上 = 80 の中央 = 80 + 80/2 = 120 をマウスに置くと gridX=1
      const mouseX = 120
      const mouseY = 120
      const { gridPosition, previewPosition } = calculateDragPosition({
        mouseX, mouseY, cellSize: CELL_SIZE, transform, snapToGrid: true
      })
      expect(gridPosition).toMatchObject({ x: 1, y: 1 })
      const derived = gridPositionToScreenPosition(gridPosition!, CELL_SIZE, transform)
      expect(previewPosition).toEqual(derived)
    })

    test('負方向境界: マウス(-10,-10) スナップ動作', () => {
      const transform = { x: 0, y: 0, scale: 1 }
      const { gridPosition, previewPosition } = calculateDragPosition({
        mouseX: -10, mouseY: -10, cellSize: CELL_SIZE, transform, snapToGrid: true
      })
      // 左上は -50,-50 付近 -> grid -1 or 0? 計算仕様: round(left/80)
      // 左上 = mouse - 80/2 = -10 - 40 = -50 => -50/80 = -0.625 => round = -1
      expect(gridPosition).toMatchObject({ x: -1, y: -1 })
      const derived = gridPositionToScreenPosition(gridPosition!, CELL_SIZE, transform)
      expect(previewPosition).toEqual(derived)
    })

    test('浮動小数点累積: 連続ズーム値 (scale=1.3333)', () => {
      const transform = { x: 123.456, y: -78.9, scale: 1.3333 }
      const { gridPosition, previewPosition } = calculateDragPosition({
        mouseX: 987.65, mouseY: -432.1, cellSize: CELL_SIZE, transform, snapToGrid: true
      })
      const derived = gridPositionToScreenPosition(gridPosition!, CELL_SIZE, transform)
      expect(Math.abs(previewPosition.x - derived.x)).toBeLessThan(0.0001)
      expect(Math.abs(previewPosition.y - derived.y)).toBeLessThan(0.0001)
    })

    test('大座標: 1e6 付近でも一貫性', () => {
      const transform = { x: 1_000_000, y: -1_000_000, scale: 1 }
      const { gridPosition, previewPosition } = calculateDragPosition({
        mouseX: 1_000_400, mouseY: -999_600, cellSize: CELL_SIZE, transform, snapToGrid: true
      })
      const derived = gridPositionToScreenPosition(gridPosition!, CELL_SIZE, transform)
      expect(previewPosition).toEqual(derived)
    })
  }) // end of 追加境界テスト / Edge Cases describe
}) // end root describe dragCoordinates unified API

// 最小構成につき dragCoordinates テストは一旦無効化
export {}
