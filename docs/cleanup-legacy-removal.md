# Legacy Cleanup Summary (2025-09-13)

This document records the final removal of deprecated coordinate & board components after unifying all drag/grid/zoom logic under `src/lib/dragCoordinates.ts`.

## Removed Files
- `src/lib/dragPreviewUtils.ts`
- `src/components/board/GridBoard.tsx`
- `src/components/board/GridBoardNew.tsx`
- `src/components/canvas/NewPreviewCard_TDD.tsx`

These files were legacy or TDD-only artifacts. All functionality is now provided by:
- `src/lib/dragCoordinates.ts`
- `src/components/board/NewGridBoard.tsx`
- `src/components/canvas/DragDropCanvas.tsx`

## Unified Public API
```
calculateDragPosition(params)
calculateGridPosition(params)
gridPositionToScreenPosition(params)
```
All rendering (preview & final placement) flows through these invariants.

## Guarantees
1. Preview position == final placement after drop when snap=true (grid invariant).
2. No consumer uses deprecated `calculatePreviewPosition`.
3. No remaining imports of deleted modules.

## Follow-up (Optional)
- Remove doc references to deleted files (`architecture.md`, `migration-plan.md`).
- Introduce property-based tests for coordinate invariants.
- Expand to variable card sizes.

## Simplification (2025-09-13)
Tool palette reduced to single basic rectangle (shape) card type for focused MVP and coordinate API hardening.

---
Generated automatically during cleanup.
