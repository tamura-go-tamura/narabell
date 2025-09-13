// Narabell - Simplified Board and Card Type Definitions (Single Card Type: shape)

export type CardType = 'shape'

export interface GridPosition {
  x: number
  y: number
  w: number
  h: number
  z: number
}

export interface CardStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
  borderRadius: number
  opacity: number
  shadow: ShadowStyle
  rotation: number
}

export interface ShadowStyle {
  enabled: boolean
  color: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
}

// 単一カード (PowerPoint図形風) のシンプルなテキスト内容
export interface ShapeContent {
  text: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  color: string
}

export interface CardContent {
  type: 'shape'
  data: ShapeContent
}

export interface Card {
  id: string
  type: CardType
  position: GridPosition
  size: GridSize
  content: CardContent
  style: CardStyle
  metadata: CardMetadata
}

export interface GridSize {
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface CardMetadata {
  createdAt: Date
  updatedAt: Date
  version: number
  tags?: string[]
  notes?: string
  isEditing?: boolean
}

export interface GridConfiguration {
  cols: number
  rowHeight: number
  margin: [number, number]
  padding: [number, number]
  containerPadding: [number, number]
  breakpoints: {
    lg: number
    md: number
    sm: number
    xs: number
  }
  colsForBreakpoint: {
    lg: number
    md: number
    sm: number
    xs: number
  }
}

export interface BoardSettings {
  theme: 'light' | 'dark' | 'auto'
  snapToGrid: boolean
  showGrid: boolean
  gridSize: number
  autoSave: boolean
  exportFormat: 'markdown' | 'csv' | 'pdf' | 'pptx' | 'image'
}

export interface Board {
  id: string
  title: string
  description?: string
  gridConfig: GridConfiguration
  cards: Card[]
  settings: BoardSettings
  createdAt: Date
  updatedAt: Date
}

// Export-related (kept for future, though only one type now)
export interface ExportOptions {
  format: 'markdown' | 'csv' | 'pdf' | 'pptx' | 'image'
  quality: 'low' | 'medium' | 'high'
  includeMetadata: boolean
  customTemplate?: string
}

export interface PowerPointExportOptions extends ExportOptions {
  slideLayout: 'one-card-per-slide' | 'grid-layout' | 'theme-based'
  template: 'default' | 'minimal' | 'corporate' | 'creative'
  includeAnimations: boolean
  exportNotes: boolean
  resolution: 'standard' | 'hd' | '4k'
}
