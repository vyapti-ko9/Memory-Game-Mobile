/**
 * Mirrors memory-game-react `src/index.css` game-board-slot rules (clamp + vw + breakpoints).
 */
import type { BoardSize } from "@/constants/cardSets"

/** Tailwind `sm:` */
export const BP_SM = 640
/** React game-board large-board tweak */
export const BP_NARROW_LARGE = 520
/** React `SMALL_SCREEN_MAX_WIDTH` */
export const BP_XS = 420

export type CardClamp = { min: number; max: number; vwPercent: number }

function clampForBoard(boardSize: BoardSize, windowWidth: number): CardClamp {
  const w420 = windowWidth <= BP_XS
  const w520 = windowWidth <= BP_NARROW_LARGE

  if (boardSize === "large") {
    if (w420) return { min: 36, max: 50, vwPercent: 15 }
    if (w520) return { min: 34, max: 54, vwPercent: 10.5 }
    return { min: 48, max: 80, vwPercent: 14 }
  }
  if (boardSize === "medium") {
    if (w420) return { min: 44, max: 64, vwPercent: 14 }
    return { min: 52, max: 88, vwPercent: 18 }
  }
  if (w420) return { min: 48, max: 72, vwPercent: 17 }
  return { min: 56, max: 104, vwPercent: 22 }
}

/** Width/height for one playing card: CSS clamp + shrink-to-fit row (like React auto grid). */
export function getPlayingCardSize(
  boardSize: BoardSize,
  windowWidth: number,
  cols: number,
  boardInnerWidth: number,
  gap: number,
): { width: number; height: number } {
  const { min, max, vwPercent } = clampForBoard(boardSize, windowWidth)
  const fluid = (windowWidth / 100) * vwPercent
  const ideal = Math.min(max, Math.max(min, fluid))
  const maxFit = cols > 0 ? (boardInnerWidth - (cols - 1) * gap) / cols : ideal
  // Always prioritize fitting the requested column count on-screen.
  const width = Math.max(1, Math.min(max, ideal, maxFit))
  const height = (width * 7) / 5
  return { width, height }
}

/** Gap: `gap-x-0.5 sm:gap-x-1` → 2px / 4px */
export function getBoardGap(windowWidth: number): number {
  return windowWidth >= BP_SM ? 5 : 2
}

/** Play area horizontal padding: `px-2 sm:px-5` */
export function getPlayAreaHorizontalPad(windowWidth: number): number {
  return windowWidth >= BP_SM ? 20 : 8
}
