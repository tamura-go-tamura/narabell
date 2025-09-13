# Narabell 技術スタック移行計画

## 現在の課題

### react-grid-layoutの制限
- **マイナス座標未対応**: 左上方向への拡張ができない
- **座標系の複雑化**: GRID_OFFSETによる回避策が必要
- **無限キャンバスとの不整合**: ズーム・パン時の座標計算が複雑

### 現在のスタック
```typescript
// 問題のある構成
ReactGridLayout + InfiniteCanvas
├── Math.max(0, gridX) // マイナス座標の強制的な制限
├── GRID_OFFSET による座標変換
└── 複雑な座標計算ロジック
```

## 新しい技術スタック

### 採用理由
| 技術 | 理由 | 解決する課題 |
|------|------|--------------|
| **@dnd-kit/core** | React向け高性能D&D、アクセシビリティ対応 | react-grid-layoutの座標制限 |
| **react-zoom-pan-pinch** | 実績豊富、軽量、TypeScript対応 | InfiniteCanvasの複雑性 |
| **絶対位置レイアウト** | CSS transform使用、柔軟な配置 | グリッド制約からの解放 |

### 新アーキテクチャ
```typescript
// 理想的な構成
TransformWrapper (react-zoom-pan-pinch)
└── DndContext (@dnd-kit/core)
    ├── InfiniteGrid (背景)
    └── CardContainer (絶対位置)
        └── Draggable Cards (自由配置)
```

## 実装フェーズ

### Phase 1: 準備・パッケージ導入
**期間**: 1-2日
**作業内容**:
```bash
# 新パッケージの追加
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add react-zoom-pan-pinch

# 型定義の確認
pnpm add -D @types/react-transition-group
```

**成果物**:
- package.json更新
- 基本的な型定義確認

### Phase 2: 新コンポーネント作成
**期間**: 3-4日
**作業内容**:

```typescript
// 1. ZoomPanCanvas.tsx
interface ZoomPanCanvasProps {
  children: React.ReactNode
  onTransformChange: (state: TransformState) => void
}

// 2. DragDropCanvas.tsx  
interface DragDropCanvasProps {
  cards: Card[]
  onCardMove: (id: string, position: Position) => void
  onCardDrop: (type: CardType, position: Position) => void
}

// 3. CardContainer.tsx
interface CardContainerProps {
  card: Card
  position: Position
  isSelected: boolean
  isDragging: boolean
}
```

**成果物**:
- 新しいキャンバスコンポーネント群
- ドラッグ&ドロップロジック
- 座標変換ユーティリティ

### Phase 3: グリッドシステム統合
**期間**: 2-3日
**作業内容**:

```typescript
// グリッドスナップ機能
const snapToGrid = (position: Position, cellSize: number): Position => {
  return {
    x: Math.round(position.x / cellSize) * cellSize,
    y: Math.round(position.y / cellSize) * cellSize
  }
}

// マイナス座標対応
const normalizePosition = (position: Position): GridPosition => {
  return {
    x: Math.floor(position.x / cellSize), // マイナス値も許可
    y: Math.floor(position.y / cellSize), // マイナス値も許可
    w: 2,
    h: 2,
    z: 0
  }
}
```

**成果物**:
- グリッドスナップ機能
- マイナス座標完全対応
- プレビュー機能統合

### Phase 4: GridBoard移行 (完了)
旧 `GridBoard.tsx` / `GridBoardNew.tsx` は削除。現在は `NewGridBoard.tsx` が統一API (`dragCoordinates.ts`) を利用。

```typescript
// 新しいGridBoard (最終形)
export const NewGridBoard: React.FC<NewGridBoardProps> = ({ className }) => {
  const { currentBoard, cards } = useBoardStore()
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <ToolPalette />
      
      <ZoomPanCanvas onTransformChange={handleTransformChange}>
        <InfiniteGrid cellSize={cellSize} />
        
        <DragDropCanvas
          cards={cards}
          onCardMove={handleCardMove}
          onCardDrop={handleCardDrop}
        >
          {cards.map(card => (
            <CardContainer
              key={card.id}
              card={card}
              position={card.position}
              isSelected={selectedCardIds.includes(card.id)}
            />
          ))}
        </DragDropCanvas>
      </ZoomPanCanvas>
    </div>
  )
}
```

**成果物**:
- 完全に移行されたGridBoard
- react-grid-layout依存関係削除
- 全機能テスト完了

### Phase 5: 最適化・ポリッシュ
**期間**: 1-2日
**作業内容**:
- パフォーマンス最適化
- アニメーション調整
- バグ修正
- ドキュメント更新

## 移行後の利点

### 1. 技術的利点
- **マイナス座標完全対応**: 上下左右への無限拡張
- **シンプルな座標系**: 複雑な変換ロジック不要
- **高いパフォーマンス**: 最適化されたライブラリ使用
- **保守性向上**: より直感的なコード構造

### 2. 機能的利点
- **miro風操作感**: 真の無限キャンバス実現
- **スムーズなUX**: 高性能なズーム・パン
- **柔軟なレイアウト**: グリッド制約からの解放
- **拡張性**: 新機能追加が容易

### 3. 将来的利点
- **多人数編集対応**: 状態同期が容易
- **モバイル対応**: タッチジェスチャー対応
- **パフォーマンス**: 大量カード時の最適化
- **アクセシビリティ**: @dnd-kitの標準対応

## リスク管理

### 技術的リスク
| リスク | 対策 | 影響度 |
|--------|------|--------|
| ライブラリの学習コスト | 段階的移行、十分な検証期間 | 中 |
| 既存機能の一時的な劣化 | 機能ごとの詳細テスト | 低 |
| パフォーマンスの劣化 | ベンチマークテスト実施 | 低 |

### 運用リスク
| リスク | 対策 | 影響度 |
|--------|------|--------|
| 移行期間の長期化 | 明確なマイルストーン設定 | 中 |
| バグの増加 | 段階的リリース、回帰テスト | 中 |
| ユーザー体験の変化 | UI/UXの一貫性維持 | 低 |

## 成功指標

### 定量的指標
- **座標範囲**: マイナス座標での正常動作 ✅
- **パフォーマンス**: 60fps維持、1000カード対応
- **バグ率**: 移行前と同等以下
- **バンドルサイズ**: 現在と同等以下

### 定性的指標
- **開発体験**: より直感的なコード
- **ユーザー体験**: よりスムーズな操作感
- **保守性**: 新機能追加の容易さ
- **将来性**: 多人数編集への対応準備

---

**策定日**: 2025年9月7日  
**責任者**: 開発チーム  
**レビュー予定**: 各フェーズ完了時

### 追加メモ (2025-09-13)
複数カードタイプは一時停止し、`shape` 単一に統一。座標/スナップ安定化を優先し、他タイプは後続 Phase で再導入予定。
