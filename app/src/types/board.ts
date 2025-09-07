// Narabell - Board and Card Type Definitions

export type CardType = 'text' | 'image' | 'chart' | 'list' | 'link' | 'calendar' | 'shape'

export interface GridPosition {
  x: number      // グリッド X座標
  y: number      // グリッド Y座標
  w: number      // 幅（グリッド単位）
  h: number      // 高さ（グリッド単位）
  z: number      // 重ね順（レイヤー）
}

export interface CardStyle {
  // 図形スタイル（PowerPoint/Miro風）
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
  borderRadius: number        // 角丸半径
  opacity: number            // 透明度（0-1）
  shadow: ShadowStyle
  rotation: number           // 回転角度（度）
}

export interface ShadowStyle {
  enabled: boolean
  color: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
}

// カード内容（タイプ別）
export interface CardContent {
  type: CardType
  data: TextContent | ImageContent | ChartContent | ListContent | LinkContent | CalendarContent | ShapeContent
}

// 📝 テキストカード
export interface TextContent {
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  color: string
  textAlign: 'left' | 'center' | 'right' | 'justify'
  verticalAlign: 'top' | 'middle' | 'bottom'
  lineHeight: number
  letterSpacing: number
}

// 🖼️ 画像カード
export interface ImageContent {
  src: string
  alt: string
  fit: 'cover' | 'contain' | 'fill' | 'scale-down'
  alignment: 'center' | 'top' | 'bottom' | 'left' | 'right'
  caption?: string
  filters?: {
    brightness: number    // 0-200
    contrast: number      // 0-200
    saturation: number    // 0-200
    blur: number         // 0-10
  }
}

// 📊 チャートカード
export interface ChartContent {
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter'
  data: ChartData
  options: ChartOptions
  title?: string
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

export interface ChartOptions {
  responsive: boolean
  maintainAspectRatio: boolean
  plugins?: {
    legend?: {
      display: boolean
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    title?: {
      display: boolean
      text?: string
    }
  }
}

// 📋 リストカード
export interface ListContent {
  items: ListItem[]
  listStyle: 'checklist' | 'numbered' | 'bulleted'
  allowReorder: boolean
}

export interface ListItem {
  id: string
  text: string
  checked: boolean
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

// 🔗 リンクカード
export interface LinkContent {
  url: string
  title: string
  description?: string
  thumbnail?: string
  favicon?: string
  showPreview: boolean
}

// 📅 カレンダーカード
export interface CalendarContent {
  events: CalendarEvent[]
  viewMode: 'month' | 'week' | 'day'
  highlightDates: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  description?: string
  color?: string
}

// 🔲 図形カード
export interface ShapeContent {
  shape: 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'arrow' | 'star'
  fillPattern: 'solid' | 'gradient' | 'pattern' | 'none'
  gradient?: {
    type: 'linear' | 'radial'
    colors: string[]
    direction: number
  }
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
  w: number      // 幅（グリッド単位）
  h: number      // 高さ（グリッド単位）
  minW?: number  // 最小幅
  minH?: number  // 最小高さ
  maxW?: number  // 最大幅
  maxH?: number  // 最大高さ
}

export interface CardMetadata {
  createdAt: Date
  updatedAt: Date
  version: number
  tags?: string[]
  notes?: string
}

export interface GridConfiguration {
  cols: number           // カラム数
  rowHeight: number      // 行の高さ
  margin: [number, number] // マージン [x, y]
  padding: [number, number] // パディング [x, y]
  containerPadding: [number, number] // コンテナパディング [x, y]
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

// カード操作仕様
export interface CardInteraction {
  // 基本操作
  draggable: boolean          // ドラッグ移動
  resizable: boolean          // サイズ変更
  rotatable: boolean          // 回転操作
  selectable: boolean         // 選択可能
  
  // 高度な操作
  groupable: boolean          // グループ化可能
  copyable: boolean           // コピー&ペースト
  lockable: boolean           // 位置・編集ロック
  
  // グリッド動作
  snapToGrid: boolean         // グリッドスナップ
  gridAlignment: 'corner' | 'center' | 'edge'
}

// エクスポート設定
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
