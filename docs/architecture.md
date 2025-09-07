# Narabell アーキテクチャ設計

## 概要

NarabellはMiro/PowerPoint風のグリッド型カードレイアウトアプリケーションです。ユーザーが自由にカード（テキスト・画像・リスト等）を無限キャンバス上に配置・リサイズ・編集できるWebアプリケーションを目指しています。

## 技術スタック

### フロントエンド（確定）
- **Next.js 15+** - Reactフレームワーク（App Router使用）
- **TypeScript** - 型安全性の確保
- **Tailwind CSS v4** - スタイリング
- **Zustand** - 状態管理
- **shadcn/ui** - UIコンポーネントライブラリ
- **@dnd-kit/core** - ドラッグ&ドロップ機能（react-grid-layoutから移行予定）
- **react-zoom-pan-pinch** - ズーム・パン機能（InfiniteCanvasから移行予定）
- **pnpm** - パッケージマネージャー

### 将来的な拡張（多人数編集対応）
- **Socket.io** - リアルタイム通信
- **Y.js (CRDT)** または **Operational Transformation** - 競合解決
- **NextAuth.js** - 認証
- **Redis** - セッション管理・状態同期

## アーキテクチャの進化

### Phase 1: 現在の実装（react-grid-layout使用）
```
ToolPalette → GridBoard → ReactGridLayout → CardComponent
                   ↓
                InfiniteCanvas → InfiniteGrid
```

**課題**: react-grid-layoutはマイナス座標をサポートしないため、全方向への無限拡張が困難

### Phase 2: 新アーキテクチャ（移行予定）
```
ToolPalette → GridBoard → TransformWrapper
                             ↓
                         DndContext → CardContainer
                             ↓           ↓
                         InfiniteGrid   Draggable Cards
```

**利点**:
- マイナス座標の完全サポート
- 無限キャンバスの実現
- リアルタイム多人数編集への対応準備
- より柔軟なドラッグ&ドロップ

## コア機能

### 1. 無限キャンバス
- 上下左右への無制限拡張
- スムーズなズーム・パン操作
- グリッドスナップ機能

### 2. カード管理
- 7種類のカードタイプ（text, image, list, chart, link, calendar, shape）
- ドラッグ&ドロップによる配置
- リサイズ・移動・編集
- 複数選択・グループ操作

### 3. グリッドシステム
- 40px単位の正方形グリッド
- グリッドの表示/非表示切り替え
- スナップ機能のON/OFF

## 状態管理

### Zustandストア構造
```typescript
interface BoardState {
  // Board状態
  currentBoard: Board | null
  boards: Board[]
  
  // Card状態
  selectedCardIds: string[]
  
  // UI状態（ユーザー固有）
  isGridVisible: boolean
  isSnapToGrid: boolean
  zoom: number
  viewportState: { x: number; y: number; scale: number }
  
  // アクション（同期対象）
  addCard: (type: CardType, position: GridPosition) => void
  moveCard: (cardId: string, position: GridPosition) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  // ...
}
```

### 座標系
- **グリッド座標**: 整数値、マイナス値も許可
- **ピクセル座標**: グリッド座標 × cellSize(40px)
- **ビューポート座標**: ズーム・パン変換後の表示座標

## ファイル構造

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── board/             # ボード関連コンポーネント
│   │   ├── GridBoard.tsx  # メインボードコンポーネント
│   │   └── ToolPalette.tsx # ツールバー
│   ├── cards/             # カード関連コンポーネント
│   │   ├── CardComponent.tsx
│   │   ├── TextCard.tsx
│   │   ├── ImageCard.tsx
│   │   └── ...
│   └── canvas/            # キャンバス関連
│       ├── InfiniteCanvas.tsx
│       └── InfiniteGrid.tsx
├── stores/
│   └── boardStore.ts      # Zustand状態管理
├── types/
│   └── board.ts           # 型定義
└── lib/                   # ユーティリティ関数
```

## 移行計画

### Step 1: パッケージ追加
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add react-zoom-pan-pinch
```

### Step 2: 新しいCanvasコンポーネント作成
- `ZoomPanCanvas.tsx` - react-zoom-pan-pinch使用
- `DragDropCanvas.tsx` - @dnd-kit/core使用
- `CardContainer.tsx` - 絶対位置でカード配置

### Step 3: 段階的移行
1. 既存のGridBoardを新アーキテクチャで置き換え
2. ドラッグ&ドロップロジックを@dnd-kitに移行
3. ズーム・パン機能をreact-zoom-pan-pinchに移行
4. react-grid-layout依存関係を削除

### Step 4: 多人数編集準備
1. WebSocket接続実装
2. 状態同期機能追加
3. 競合解決メカニズム実装
4. ユーザープレゼンス表示

## 設計原則

1. **型安全性**: TypeScriptを活用した厳密な型定義
2. **コンポーネント分離**: 責務の明確な分離
3. **状態の一元管理**: Zustandによる予測可能な状態変更
4. **パフォーマンス**: 必要最小限の再レンダリング
5. **拡張性**: 将来的な機能追加に対応する柔軟な設計
6. **協調編集対応**: 多人数での同時編集を想定した設計

## パフォーマンス考慮事項

### レンダリング最適化
- React.memo による不要な再レンダリング防止
- useCallback/useMemo による関数・値のメモ化
- 仮想化による大量カードの効率的表示

### 座標計算最適化
- グリッドスナップ計算のキャッシュ
- ビューポート外カードの描画スキップ
- デバウンスによるドラッグイベント制御

## セキュリティ考慮事項

### データ保護
- XSS攻撃の防止（カードコンテンツのサニタイズ）
- CSRF保護
- 適切な認証・認可

### 多人数編集時の考慮
- ユーザー権限管理
- データの不整合防止
- プライバシー保護

---

**最終更新**: 2025年9月7日
**バージョン**: v1.0.0-alpha
