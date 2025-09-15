// Basic shape domain types (shared between board & tool palette)
// Keep minimal for clarity.

export type ShapeKind = 'rect' | 'circle'

export interface Shape {
  id: string
  kind: ShapeKind
  x: number
  y: number
  w: number
  h: number
  label: string
  z: number
}

// Default creation sizes per shape kind
export const DEFAULT_SIZES: Record<ShapeKind, { w: number; h: number }> = {
  rect: { w: 240, h: 160 },
  circle: { w: 160, h: 160 }
}
