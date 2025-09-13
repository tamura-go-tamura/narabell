import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Board, Card, CardType, GridPosition, CardStyle, CardContent } from '@/types/board'

interface BoardState {
  // Board状態
  currentBoard: Board | null
  boards: Board[]
  
  // Card状態
  selectedCardIds: string[]
  draggedCard: Card | null
  
  // UI状態
  isGridVisible: boolean
  isSnapToGrid: boolean
  zoom: number
  
  // アクション
  setCurrentBoard: (board: Board) => void
  addCard: (type: CardType, position: GridPosition) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  removeCard: (cardId: string) => void
  moveCard: (cardId: string, position: GridPosition) => void
  resizeCard: (cardId: string, size: { w: number; h: number }) => void
  selectCard: (cardId: string) => void
  selectMultipleCards: (cardIds: string[]) => void
  clearSelection: () => void
  
  // Board操作
  createBoard: (title: string) => Board
  updateBoard: (updates: Partial<Board>) => void
  deleteBoard: (boardId: string) => void
  
  // Grid設定
  toggleGrid: () => void
  toggleSnapToGrid: () => void
  setZoom: (zoom: number) => void
  
  // その他
  duplicateCard: (cardId: string) => void
  exportBoard: (format: string) => void
}

// デフォルトのグリッド設定 - 正方形グリッドで完全一致を目指す
const defaultGridConfig = {
  cols: 12,
  rowHeight: 40,  // グリッドセルサイズと完全に一致
  margin: [0, 0] as [number, number],  // マージンを完全に0に
  padding: [0, 0] as [number, number],
  containerPadding: [0, 0] as [number, number],  // パディングも0に
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480
  },
  colsForBreakpoint: {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4
  }
}

// デフォルトのボード設定
const defaultBoardSettings = {
  theme: 'light' as const,
  snapToGrid: true,
  showGrid: true,
  gridSize: 20,
  autoSave: true,
  exportFormat: 'markdown' as const
}

// デフォルトのカードスタイル
const defaultCardStyle: CardStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#d1d5db',
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 8,
  opacity: 1,
  rotation: 0,
  shadow: {
    enabled: true,
    color: 'rgba(0, 0, 0, 0.1)',
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    spread: 0
  }
}

// カード作成ヘルパー
const createCard = (type: CardType, position: GridPosition): Card => {
  const id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const content: CardContent = {
    type: 'shape',
    data: {
      text: '',
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#000000'
    }
  }
  
  return {
    id,
    type: 'shape',
    position,
    size: { w: 2, h: 2 },
    content,
    style: defaultCardStyle,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  }
}

// ボード作成ヘルパー
const createBoard = (title: string): Board => {
  return {
    id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: '',
    gridConfig: defaultGridConfig,
    cards: [],
    settings: defaultBoardSettings,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export const useBoardStore = create<BoardState>()(
  subscribeWithSelector((set, get) => ({
    // 初期状態
    currentBoard: null,
    boards: [],
    selectedCardIds: [],
    draggedCard: null,
    isGridVisible: true,
    isSnapToGrid: true,
    zoom: 1,
    
    // Board操作
    createBoard: (title: string) => {
      const newBoard = createBoard(title)
      set(state => ({
        boards: [...state.boards, newBoard],
        currentBoard: newBoard
      }))
      return newBoard
    },
    
    setCurrentBoard: (board: Board) => {
      set({ currentBoard: board })
    },
    
    updateBoard: (updates: Partial<Board>) => {
      set(state => {
        if (!state.currentBoard) return state
        
        const updatedBoard = {
          ...state.currentBoard,
          ...updates,
          updatedAt: new Date()
        }
        
        return {
          currentBoard: updatedBoard,
          boards: state.boards.map(board => 
            board.id === updatedBoard.id ? updatedBoard : board
          )
        }
      })
    },
    
    deleteBoard: (boardId: string) => {
      set(state => ({
        boards: state.boards.filter(board => board.id !== boardId),
        currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard
      }))
    },
    
    // Card操作
    addCard: (_type: CardType, position: GridPosition) => {
      const newCard = createCard('shape', position)
      
      set(state => {
        if (!state.currentBoard) return state
        
        const updatedBoard = {
          ...state.currentBoard,
          cards: [...state.currentBoard.cards, newCard],
          updatedAt: new Date()
        }
        
        return {
          currentBoard: updatedBoard,
          boards: state.boards.map(board => 
            board.id === updatedBoard.id ? updatedBoard : board
          )
        }
      })
    },
    
    updateCard: (cardId: string, updates: Partial<Card>) => {
      set(state => {
        if (!state.currentBoard) return state
        
        const updatedBoard = {
          ...state.currentBoard,
          cards: state.currentBoard.cards.map(card =>
            card.id === cardId 
              ? { ...card, ...updates, metadata: { ...card.metadata, updatedAt: new Date() }}
              : card
          ),
          updatedAt: new Date()
        }
        
        return {
          currentBoard: updatedBoard,
          boards: state.boards.map(board => 
            board.id === updatedBoard.id ? updatedBoard : board
          )
        }
      })
    },
    
    removeCard: (cardId: string) => {
      set(state => {
        if (!state.currentBoard) return state
        
        const updatedBoard = {
          ...state.currentBoard,
          cards: state.currentBoard.cards.filter(card => card.id !== cardId),
          updatedAt: new Date()
        }
        
        return {
          currentBoard: updatedBoard,
          boards: state.boards.map(board => 
            board.id === updatedBoard.id ? updatedBoard : board
          ),
          selectedCardIds: state.selectedCardIds.filter(id => id !== cardId)
        }
      })
    },
    
    moveCard: (cardId: string, position: GridPosition) => {
      get().updateCard(cardId, { position })
    },
    
    resizeCard: (cardId: string, size: { w: number; h: number }) => {
      get().updateCard(cardId, { size })
    },
    
    duplicateCard: (cardId: string) => {
      const state = get()
      if (!state.currentBoard) return
      
      const cardToDuplicate = state.currentBoard.cards.find(card => card.id === cardId)
      if (!cardToDuplicate) return
      
      const newPosition = {
        ...cardToDuplicate.position,
        x: cardToDuplicate.position.x + 1,
        y: cardToDuplicate.position.y + 1
      }
      
      const duplicatedCard = createCard(cardToDuplicate.type, newPosition)
      duplicatedCard.content = { ...cardToDuplicate.content }
      duplicatedCard.style = { ...cardToDuplicate.style }
      duplicatedCard.size = { ...cardToDuplicate.size }
      
      state.addCard(duplicatedCard.type, newPosition)
    },
    
    // 選択操作
    selectCard: (cardId: string) => {
      set({ selectedCardIds: [cardId] })
    },
    
    selectMultipleCards: (cardIds: string[]) => {
      set({ selectedCardIds: cardIds })
    },
    
    clearSelection: () => {
      set({ selectedCardIds: [] })
    },
    
    // Grid設定
    toggleGrid: () => {
      set(state => ({ isGridVisible: !state.isGridVisible }))
    },
    
    toggleSnapToGrid: () => {
      set(state => ({ isSnapToGrid: !state.isSnapToGrid }))
    },
    
    setZoom: (zoom: number) => {
      set({ zoom: Math.max(0.1, Math.min(3, zoom)) })
    },
    
    // エクスポート
    exportBoard: (format: string) => {
      // TODO: エクスポート機能の実装
      console.log(`Exporting board in ${format} format`)
    }
  }))
)

// Zustandのローカルストレージ永続化
import { persist } from 'zustand/middleware'

export const useBoardStorePersisted = create<BoardState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // ... 上記と同じ実装
      currentBoard: null,
      boards: [],
      selectedCardIds: [],
      draggedCard: null,
      isGridVisible: true,
      isSnapToGrid: true,
      zoom: 1,
      
      createBoard: (title: string) => {
        const newBoard = createBoard(title)
        set(state => ({
          boards: [...state.boards, newBoard],
          currentBoard: newBoard
        }))
        return newBoard
      },
      
      setCurrentBoard: (board: Board) => {
        set({ currentBoard: board })
      },
      
      updateBoard: (updates: Partial<Board>) => {
        set(state => {
          if (!state.currentBoard) return state
          
          const updatedBoard = {
            ...state.currentBoard,
            ...updates,
            updatedAt: new Date()
          }
          
          return {
            currentBoard: updatedBoard,
            boards: state.boards.map(board => 
              board.id === updatedBoard.id ? updatedBoard : board
            )
          }
        })
      },
      
      deleteBoard: (boardId: string) => {
        set(state => ({
          boards: state.boards.filter(board => board.id !== boardId),
          currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard
        }))
      },
      
      addCard: (_type: CardType, position: GridPosition) => {
        const newCard = createCard('shape', position)
        
        set(state => {
          if (!state.currentBoard) return state
          
          const updatedBoard = {
            ...state.currentBoard,
            cards: [...state.currentBoard.cards, newCard],
            updatedAt: new Date()
          }
          
          return {
            currentBoard: updatedBoard,
            boards: state.boards.map(board => 
              board.id === updatedBoard.id ? updatedBoard : board
            )
          }
        })
      },
      
      updateCard: (cardId: string, updates: Partial<Card>) => {
        set(state => {
          if (!state.currentBoard) return state
          
          const updatedBoard = {
            ...state.currentBoard,
            cards: state.currentBoard.cards.map(card =>
              card.id === cardId 
                ? { ...card, ...updates, metadata: { ...card.metadata, updatedAt: new Date() }}
                : card
            ),
            updatedAt: new Date()
          }
          
          return {
            currentBoard: updatedBoard,
            boards: state.boards.map(board => 
              board.id === updatedBoard.id ? updatedBoard : board
            )
          }
        })
      },
      
      removeCard: (cardId: string) => {
        set(state => {
          if (!state.currentBoard) return state
          
          const updatedBoard = {
            ...state.currentBoard,
            cards: state.currentBoard.cards.filter(card => card.id !== cardId),
            updatedAt: new Date()
          }
          
          return {
            currentBoard: updatedBoard,
            boards: state.boards.map(board => 
              board.id === updatedBoard.id ? updatedBoard : board
            ),
            selectedCardIds: state.selectedCardIds.filter(id => id !== cardId)
          }
        })
      },
      
      moveCard: (cardId: string, position: GridPosition) => {
        get().updateCard(cardId, { position })
      },
      
      resizeCard: (cardId: string, size: { w: number; h: number }) => {
        get().updateCard(cardId, { size })
      },
      
      duplicateCard: (cardId: string) => {
        const state = get()
        if (!state.currentBoard) return
        
        const cardToDuplicate = state.currentBoard.cards.find(card => card.id === cardId)
        if (!cardToDuplicate) return
        
        const newPosition = {
          ...cardToDuplicate.position,
          x: cardToDuplicate.position.x + 1,
          y: cardToDuplicate.position.y + 1
        }
        
        const duplicatedCard = createCard(cardToDuplicate.type, newPosition)
        duplicatedCard.content = { ...cardToDuplicate.content }
        duplicatedCard.style = { ...cardToDuplicate.style }
        duplicatedCard.size = { ...cardToDuplicate.size }
        
        state.addCard(duplicatedCard.type, newPosition)
      },
      
      selectCard: (cardId: string) => {
        set({ selectedCardIds: [cardId] })
      },
      
      selectMultipleCards: (cardIds: string[]) => {
        set({ selectedCardIds: cardIds })
      },
      
      clearSelection: () => {
        set({ selectedCardIds: [] })
      },
      
      toggleGrid: () => {
        set(state => ({ isGridVisible: !state.isGridVisible }))
      },
      
      toggleSnapToGrid: () => {
        set(state => ({ isSnapToGrid: !state.isSnapToGrid }))
      },
      
      setZoom: (zoom: number) => {
        set({ zoom: Math.max(0.1, Math.min(3, zoom)) })
      },
      
      exportBoard: (format: string) => {
        console.log(`Exporting board in ${format} format`)
      }
    })),
    {
      name: 'narabell-board-storage',
      // 永続化しないプロパティ
      partialize: (state) => ({
        boards: state.boards,
        currentBoard: state.currentBoard,
        isGridVisible: state.isGridVisible,
        isSnapToGrid: state.isSnapToGrid,
        zoom: state.zoom
      })
    }
  )
)
