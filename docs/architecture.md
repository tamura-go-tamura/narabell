# Narabell アーキテクチャ設計

## 概要

NarabellはMiro/PowerPoint風のグリッド型カードレイアウトアプリケーションです。現在のMVPでは単一の「図形カード (shape)」のみを提供し、その中でシンプルなテキストを直接編集（PowerPointの図形テキストと同様）できます。将来フェーズで他タイプ（テキスト/画像/リスト等）は段階的に再導入予定です。

## 技術スタック

### フロントエンド（確定）
- Next.js 15+ (App Router)
- TypeScript (Strict)
- Tailwind CSS v4
- Zustand
- shadcn/ui
- @dnd-kit/core
- pnpm

## 現状アーキテクチャ (単一カードタイプ版)
```
ToolPalette → NewGridBoard → ZoomPanCanvas
                       ↓
                 InfiniteGrid (背景)
                       ↓
                  CardComponent (shape+text)
```

## コア機能 (MVP)
- 単一カード: shape（四角形）
- 図形内部のプレーンテキスト編集（ダブルクリックで編集 / Escでキャンセル / Cmd+Enterで確定）
- 無限キャンバス + ズーム/パン
- グリッド表示 / スナップ
- 座標計算統一API: `dragCoordinates.ts` (calculateDragPosition / calculateGridPosition / gridPositionToScreenPosition)

## カードモデル
```ts
// types/board.ts 抜粋
export type CardType = 'shape'
interface ShapeContent { text: string; fontSize: number; fontWeight: 'normal'|'bold'; textAlign: 'left'|'center'|'right'; color: string }
```

## コンポーネント構成
```
src/
├── components/
│   ├── board/
│   │   ├── NewGridBoard.tsx      # メインボード
│   │   └── ToolPalette.tsx       # shape追加のみ
│   ├── cards/
│   │   └── CardComponent.tsx     # 単一カード & インラインテキスト編集
│   └── canvas/
│       ├── InfiniteGrid.tsx
│       ├── NewPreviewCard.tsx    # ドラッグプレビュー（shape専用）
│       └── ZoomPanCanvas.tsx
├── lib/dragCoordinates.ts        # 統一座標API
├── stores/boardStore.ts          # 単一タイプ対応済
└── types/board.ts                # shapeのみ
```

## 削除/廃止済み
- 複数カードタイプ(Text/Image/List/Chart/Link/Calendar)関連ファイル
- 旧プレビュー / 旧座標ユーティリティ

## 拡張方針
- Phase2以降で他タイプ再導入時も `CardComponent` を差し替えず拡張できるよう、現在は最小の shape+text モデルを採用。
- 将来: Rich Text / 画像埋め込み / リストは `content.variant` 拡張 or 新しい型追加で対応。

## 編集体験仕様
- ダブルクリック: 編集開始
- Esc: 変更破棄 & 終了
- Cmd/Ctrl + Enter: 保存 & 終了
- フォーカス外れ: 保存

## 座標系 (不変仕様)
- グリッド単位 = 40px
- 追加カード初期サイズ = 2x2 セル
- すべてのドラッグ: 統一API経由で計算

## 今後の安全な拡張のための指針
1. `types/board.ts` の CardContent を discriminated union で再拡張
2. 既存API (addCard/moveCard/updateCard) のシグネチャは維持
3. テストは `dragCoordinates.test.ts` を起点に差分追加

---
最終更新: 2025-09-14 (単一shapeカードMVP反映)
