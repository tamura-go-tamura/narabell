# 多人数リアルタイム編集 設計書

## 概要

Narabellの将来的な多人数リアルタイム編集機能の設計とアーキテクチャを定義します。現在の単一ユーザー版から段階的に移行し、miroのようなコラボレーション機能を実現します。

## アーキテクチャ概要

### システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ ├─ React UI     │◄──►│ ├─ Next.js API  │◄──►│ ├─ PostgreSQL   │
│ ├─ Zustand      │    │ ├─ Socket.io    │    │ ├─ Redis        │
│ ├─ Socket.io    │    │ ├─ Y.js/OT      │    │ └─ File Storage │
│ └─ @dnd-kit     │    │ └─ NextAuth.js  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### データフロー
```
User Action → Local State → Broadcast → Other Users → State Sync → UI Update
     ↓             ↓           ↓           ↓            ↓          ↓
   ドラッグ      Zustand    Socket.io    受信側       CRDT      再描画
```

## 状態管理アーキテクチャ

### 1. 分離された状態管理

```typescript
interface CollaborativeState {
  // 同期対象（全ユーザー共有）
  shared: {
    boardData: Board
    cards: Card[]
    boardMetadata: BoardMetadata
  }
  
  // ローカル状態（ユーザー固有）
  local: {
    selectedCardIds: string[]
    viewportState: ViewportState
    uiState: UIState
  }
  
  // プレゼンス状態（他ユーザーの状態表示用）
  presence: {
    users: OnlineUser[]
    cursors: UserCursor[]
    selections: UserSelection[]
  }
}
```

### 2. イベントベースの状態変更

```typescript
type CollaborativeEvent = 
  | { type: 'CARD_ADDED'; payload: { card: Card; userId: string } }
  | { type: 'CARD_MOVED'; payload: { cardId: string; position: Position; userId: string } }
  | { type: 'CARD_UPDATED'; payload: { cardId: string; updates: Partial<Card>; userId: string } }
  | { type: 'CARD_DELETED'; payload: { cardId: string; userId: string } }
  | { type: 'USER_CURSOR'; payload: { userId: string; position: Position } }
  | { type: 'USER_SELECTION'; payload: { userId: string; cardIds: string[] } }

// イベント処理
const handleCollaborativeEvent = (event: CollaborativeEvent) => {
  switch (event.type) {
    case 'CARD_MOVED':
      // 競合解決ロジック適用
      const resolvedPosition = resolveConflict(event.payload)
      updateCardPosition(event.payload.cardId, resolvedPosition)
      break
    // ...
  }
}
```

## 競合解決メカニズム

### 1. CRDT (Conflict-free Replicated Data Types) アプローチ

```typescript
// Y.js使用例
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

interface YJSBoardState {
  cards: Y.Map<Card>
  boardConfig: Y.Map<any>
  history: Y.Array<BoardEvent>
}

const yDoc = new Y.Doc()
const yCards = yDoc.getMap('cards')
const yHistory = yDoc.getArray('history')

// カード追加（自動的に同期される）
const addCard = (card: Card) => {
  yCards.set(card.id, card)
  yHistory.push([{ type: 'CARD_ADDED', cardId: card.id, timestamp: Date.now() }])
}

// リアルタイム変更監視
yCards.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    if (change.action === 'add') {
      // 他ユーザーからのカード追加
      const card = yCards.get(key)
      addCardToLocalState(card)
    }
  })
})
```

### 2. Operational Transformation (OT) アプローチ

```typescript
interface Operation {
  type: 'move' | 'resize' | 'update' | 'delete'
  cardId: string
  before: any
  after: any
  timestamp: number
  userId: string
}

class OperationalTransform {
  // 操作の変換
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.cardId !== op2.cardId) {
      return [op1, op2] // 異なるカードなら競合なし
    }
    
    if (op1.type === 'move' && op2.type === 'move') {
      // 同じカードの移動競合 - より新しいタイムスタンプを優先
      return op1.timestamp > op2.timestamp ? [op1, null] : [null, op2]
    }
    
    // その他の変換ロジック...
  }
  
  // 操作の適用
  apply(operation: Operation, state: BoardState): BoardState {
    switch (operation.type) {
      case 'move':
        return {
          ...state,
          cards: state.cards.map(card =>
            card.id === operation.cardId
              ? { ...card, position: operation.after }
              : card
          )
        }
      // ...
    }
  }
}
```

## リアルタイム通信

### 1. Socket.io実装

```typescript
// クライアント側
import { io, Socket } from 'socket.io-client'

interface ServerToClientEvents {
  boardUpdate: (event: CollaborativeEvent) => void
  userJoined: (user: OnlineUser) => void
  userLeft: (userId: string) => void
  cursorUpdate: (cursor: UserCursor) => void
}

interface ClientToServerEvents {
  joinBoard: (boardId: string) => void
  leaveBoard: (boardId: string) => void
  broadcastEvent: (event: CollaborativeEvent) => void
  updateCursor: (position: Position) => void
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io()

// イベント送信
const broadcastCardMove = (cardId: string, position: Position) => {
  socket.emit('broadcastEvent', {
    type: 'CARD_MOVED',
    payload: { cardId, position, userId: currentUser.id }
  })
}

// イベント受信
socket.on('boardUpdate', (event) => {
  if (event.payload.userId !== currentUser.id) {
    handleCollaborativeEvent(event)
  }
})
```

### 2. サーバー側実装

```typescript
// pages/api/socket.ts
import { Server } from 'socket.io'
import type { NextApiRequest, NextApiResponse } from 'next'

interface Room {
  boardId: string
  users: Map<string, OnlineUser>
  state: BoardState
}

const rooms = new Map<string, Room>()

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server)
    
    io.on('connection', (socket) => {
      socket.on('joinBoard', (boardId) => {
        socket.join(boardId)
        
        // ルーム管理
        if (!rooms.has(boardId)) {
          rooms.set(boardId, {
            boardId,
            users: new Map(),
            state: getInitialBoardState(boardId)
          })
        }
        
        const room = rooms.get(boardId)!
        room.users.set(socket.id, { id: socket.id, name: 'User' })
        
        // 他ユーザーに参加通知
        socket.to(boardId).emit('userJoined', { id: socket.id, name: 'User' })
      })
      
      socket.on('broadcastEvent', (event) => {
        const boardId = getBoardIdFromSocket(socket)
        if (boardId) {
          // 他のユーザーにブロードキャスト
          socket.to(boardId).emit('boardUpdate', event)
          
          // サーバー側状態更新
          updateServerState(boardId, event)
        }
      })
      
      socket.on('disconnect', () => {
        // ユーザー離脱処理
        handleUserDisconnect(socket.id)
      })
    })
    
    res.socket.server.io = io
  }
  res.end()
}
```

## ユーザープレゼンス機能

### 1. ユーザーカーソル表示

```typescript
interface UserCursor {
  userId: string
  userName: string
  position: Position
  color: string
  lastUpdate: number
}

const UserCursors: React.FC = () => {
  const { onlineUsers, viewportState } = useCollaboration()
  
  return (
    <>
      {onlineUsers.map(user => (
        <div
          key={user.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: user.cursor.position.x,
            top: user.cursor.position.y,
            transform: `scale(${1 / viewportState.scale})` // ズームに追従
          }}
        >
          <CursorIcon color={user.color} />
          <span className="ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
            {user.name}
          </span>
        </div>
      ))}
    </>
  )
}
```

### 2. ユーザー選択状態表示

```typescript
const UserSelections: React.FC = () => {
  const { onlineUsers, cards } = useCollaboration()
  
  return (
    <>
      {onlineUsers.map(user => (
        user.selectedCardIds.map(cardId => {
          const card = cards.find(c => c.id === cardId)
          if (!card) return null
          
          return (
            <div
              key={`${user.id}-${cardId}`}
              className="absolute pointer-events-none border-2 border-dashed"
              style={{
                left: card.position.x * cellSize,
                top: card.position.y * cellSize,
                width: card.size.w * cellSize,
                height: card.size.h * cellSize,
                borderColor: user.color,
                opacity: 0.6
              }}
            />
          )
        })
      ))}
    </>
  )
}
```

## 権限・認証システム

### 1. 権限レベル

```typescript
type Permission = 'owner' | 'editor' | 'viewer' | 'commenter'

interface BoardAccess {
  boardId: string
  userId: string
  permission: Permission
  grantedAt: Date
  grantedBy: string
}

// 権限チェック
const canEditCard = (userId: string, cardId: string): boolean => {
  const userPermission = getUserPermission(userId, currentBoard.id)
  return ['owner', 'editor'].includes(userPermission)
}
```

### 2. 認証フロー

```typescript
// NextAuth.js設定
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  
  session: {
    strategy: 'jwt',
  },
  
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    
    session: async ({ session, token }) => {
      session.user.id = token.id as string
      return session
    },
  },
}
```

## パフォーマンス最適化

### 1. イベント最適化

```typescript
// デバウンス処理
const debouncedCursorUpdate = debounce((position: Position) => {
  socket.emit('updateCursor', position)
}, 50)

// バッチ処理
const batchedUpdates = new Map<string, CollaborativeEvent>()

const batchUpdate = (event: CollaborativeEvent) => {
  batchedUpdates.set(event.payload.cardId, event)
  
  // 16ms (60fps) ごとにバッチ送信
  requestAnimationFrame(() => {
    const events = Array.from(batchedUpdates.values())
    if (events.length > 0) {
      socket.emit('batchEvents', events)
      batchedUpdates.clear()
    }
  })
}
```

### 2. メモリ管理

```typescript
// 古いイベントのクリーンアップ
const EVENT_RETENTION_TIME = 5 * 60 * 1000 // 5分

const cleanupOldEvents = () => {
  const cutoff = Date.now() - EVENT_RETENTION_TIME
  
  // メモリからの削除
  eventHistory = eventHistory.filter(event => event.timestamp > cutoff)
  
  // DBからの削除（バックグラウンド）
  scheduleEventCleanup(cutoff)
}
```

## 実装フェーズ

### Phase 1: 基盤構築 (2週間)
- Socket.io統合
- 基本的な状態同期
- ユーザー認証
- ルーム管理

### Phase 2: リアルタイム編集 (2週間)
- カード操作の同期
- 競合解決実装
- ユーザープレゼンス
- 基本的なUI

### Phase 3: 高度な機能 (2週間)
- 権限管理
- 履歴・undo/redo
- パフォーマンス最適化
- エラーハンドリング

### Phase 4: ポリッシュ (1週間)
- UI/UX改善
- テスト充実
- ドキュメント更新
- デプロイ準備

---

**策定日**: 2025年9月7日  
**対象バージョン**: v2.0.0  
**前提条件**: v1.0.0（単一ユーザー版）完成後
