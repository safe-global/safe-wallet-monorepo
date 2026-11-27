import type { ReactElement } from 'react'
import { getQueueColumnStart, QUEUE_COLUMN_WIDTHS, QUEUE_COLUMNS, type QueueColumn } from './columns'

// A transaction row's placeholder bars: [column, px from the column's left edge, width]. Details' bars fit its
// narrowest width, at the table's floor.
const BARS: Array<[QueueColumn, number, number]> = [
  ['Nonce', 22, 24],
  ['Safe', 16, 112],
  ['Transaction', 16, 88],
  ['Details', 16, 56],
  ['Details', 90, 56],
  ['Status', 16, 48],
  ['Action', (QUEUE_COLUMN_WIDTHS.Action ?? 0) - 92, 72],
]
const SKELETON_BARS: Array<[string, number]> = BARS.map(([column, offset, width]) => [
  `calc(${getQueueColumnStart(column)} + ${offset}px)`,
  width,
])
// Compact: the nonce, the Safe and summary line, then the gauge and the action under it
const COMPACT_SKELETON_BARS: Array<[string, number, number]> = [
  ['22px', 24, 0],
  [`${(QUEUE_COLUMN_WIDTHS.Nonce ?? 0) + 16}px`, 160, -12],
  [`${(QUEUE_COLUMN_WIDTHS.Nonce ?? 0) + 16}px`, 48, 12],
  ['calc(100% - 92px)', 72, 12],
]
const BAR_HEIGHT = 12

const getSkeletonStyle = (rowHeight: number, compact: boolean) => {
  // [left, width, px off the row's middle]
  const bars: Array<[string, number, number]> = compact
    ? COMPACT_SKELETON_BARS
    : SKELETON_BARS.map(([left, width]) => [left, width, 0])
  const bar = (shift: number) => {
    const top = (rowHeight - BAR_HEIGHT) / 2 + shift
    return `linear-gradient(to bottom, transparent ${top}px, var(--muted) ${top}px, var(--muted) ${top + BAR_HEIGHT}px, transparent ${top + BAR_HEIGHT}px)`
  }
  return {
    backgroundImage: bars.map(([, , shift]) => bar(shift)).join(', '),
    backgroundSize: bars.map(([, width]) => `${width}px ${rowHeight}px`).join(', '),
    backgroundPosition: bars.map(([left]) => `${left} 0`).join(', '),
    backgroundRepeat: 'repeat-y',
  }
}

/** One painted cell of skeleton rows, `height` tall, standing in for the rows outside a virtualized window. */
const QueueSkeletonRow = ({
  height,
  rowHeight,
  compact = false,
}: {
  height: number
  rowHeight: number
  compact?: boolean
}): ReactElement | null =>
  height > 0 ? (
    <tr aria-hidden="true" data-no-hover data-no-divider data-testid="space-queue-skeleton">
      <td colSpan={QUEUE_COLUMNS.length} className="p-0!">
        <div className="animate-pulse" style={{ height, ...getSkeletonStyle(rowHeight, compact) }} />
      </td>
    </tr>
  ) : null

export default QueueSkeletonRow
