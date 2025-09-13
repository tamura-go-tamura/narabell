# TDD タスク管理 - ドラッグプレビュー座標計算 (更新版)

## 最新サマリ (2025-09-13)
- 旧レガシー座標ユーティリティ `dragPreviewUtils.ts` は完全削除。新API `dragCoordinates.ts` に統一済み。
- 現行API: `calculateDragPosition`, `calculateGridPosition`, `gridPositionToScreenPosition`。
- プレビュー=配置 の完全一貫性を保証する包括的テスト群を維持。
- 追加エッジケーステスト: 極端ズーム(0.1 / 4.0)、巨大パン(±数千〜100万)、負座標、0.5 タイブレーク、浮動小数点連続ズーム、極大座標域。
- すべてのテスト Green。

## 不変条件 (Invariants)
1. snap=false: プレビュー中央 = マウス座標 (スクリーン座標系) 常に成立。
2. snap=true: プレビュー左上スクリーン座標 = `gridPositionToScreenPosition(gridPos)` の結果と常に一致。
3. snap=true: ドロップ後の配置グリッド座標 = 計算時の `gridPosition` と一致。
4. ズーム/パンは (スクリーン→キャンバス→グリッド→キャンバス→スクリーン) の写像で逆変換整合性が保たれる。
5. 丸め規則: 2x2 カードの left-top キャンバス座標 / (cellSize*2) に `Math.round` を適用しグリッド整数化 (0.5 は正方向へ、-0.5 は負方向へ)。
6. 浮動小数点誤差は許容閾値 1e-4 未満に抑制 (テストで検証)。

## 実装ファイル
- `src/lib/dragCoordinates.ts` (唯一の座標/スナップ計算API)
- `src/lib/__tests__/dragCoordinates.test.ts` (包括テスト + エッジケース)
- `components/board/NewGridBoard.tsx` / `components/canvas/DragDropCanvas.tsx` (新API使用)

## 完了タスク
- ✅ レガシー util 削除 / 1箇所 API 統一
- ✅ ズーム/パン/スナップ一貫性 TDD
- ✅ 0.5 タイブレーク/負座標/巨大座標/極端ズーム テスト
- ✅ ドキュメント不変条件整理
- ✅ 旧ファイル削除 (`dragPreviewUtils.ts`, `GridBoard.tsx`, `GridBoardNew.tsx`, `NewPreviewCard_TDD.tsx`)

## 追加されたエッジケーステスト一覧
| カテゴリ | ケース | 目的 |
|----------|--------|------|
| Zoom Extremes | scale=0.1 / 4.0 | 極小/極大拡大時の中央保持/スナップ整合性 |
| Large Pan | (5000,-3000), (-4000,2500) + zoom | 平行移動大域での精度 |
| Negative Space | 負座標, scale=0.5, pan負 | 原点外負領域での丸め符号確認 |
| Boundary Rounding | 0.5 / -0.5 left-top | Math.round の境界動作明確化 |
| Floating Precision | scale=1.3333 | 浮動小数点誤差境界検証 |
| Huge Coordinates | ~1e6 | 64-bit 整数安全域内の安定性 |

## 今後の推奨タスク (Phase Next)
1. 可変カードサイズ対応 (w,h 任意) API v2: `calculateGridPositionV2({ cardW, cardH })`。
2. プロパティベーステスト (fast-check) でランダムズーム/パン/座標/サイズ下の invariant 自動検証。
3. UI ビジュアル回帰テスト (Playwright + screenshot diff)。
4. ドラッグ操作計測 (16ms フレーム内) の軽量ベンチ。
5. 型拡張: `Transform` / `GridPosition` を `types/board.ts` に統合し型単一出典化。
6. 競合防止: 同一グリッド占有判定 (将来: 衝突回避 & オートシフト)。

## リスク / メモ
- Math.round 戦略 → 負領域で期待と異なる場合は `floor` ベースに切替検討。
- 可変サイズ導入時、(cellSize*2) 固定計算部を抽象化要。

## 変更履歴 (今回)
- legacy util/コンポーネント完全削除: `dragPreviewUtils.ts`, `GridBoard.tsx`, `GridBoardNew.tsx`, `NewPreviewCard_TDD.tsx`。
- ドキュメント更新: 削除ステータス反映。

## コンテキスト補足
現在ツールパレットは単一カードタイプ(shape/四角) のみ。座標計算API検証のため種類を最小化。

---
Generated & maintained via TDD. 最終更新: 2025-09-13。
