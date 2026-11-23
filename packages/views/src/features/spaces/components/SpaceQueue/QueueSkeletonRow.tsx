import type { ReactElement } from 'react'
import { QUEUE_COLUMNS } from './columns'

// A transaction row's placeholder bars: [left offset, width], laid out like the columns
const SKELETON_BARS: Array<[string, number]> = [
  ['22px', 24],
  ['80px', 120],
  ['240px', 88],
  ['400px', 140],
  ['572px', 120],
  ['calc(100% - 400px)', 48],
  ['calc(100% - 92px)', 72],
]
const BAR_HEIGHT = 12

const getSkeletonStyle = (rowHeight: number) => {
  const top = (rowHeight - BAR_HEIGHT) / 2
  const bar = `linear-gradient(to bottom, transparent ${top}px, var(--muted) ${top}px, var(--muted) ${top + BAR_HEIGHT}px, transparent ${top + BAR_HEIGHT}px)`
  return {
    backgroundImage: SKELETON_BARS.map(() => bar).join(', '),
    backgroundSize: SKELETON_BARS.map(([, width]) => `${width}px ${rowHeight}px`).join(', '),
    backgroundPosition: SKELETON_BARS.map(([left]) => `${left} 0`).join(', '),
    backgroundRepeat: 'repeat-y',
  }
}

/** One painted cell of skeleton rows, `height` tall, standing in for the rows outside a virtualized window. */
const QueueSkeletonRow = ({ height, rowHeight }: { height: number; rowHeight: number }): ReactElement | null =>
  height > 0 ? (
    <tr aria-hidden="true" data-no-hover data-no-divider data-testid="space-queue-skeleton">
      <td colSpan={QUEUE_COLUMNS.length} className="p-0!">
        <div className="animate-pulse" style={{ height, ...getSkeletonStyle(rowHeight) }} />
      </td>
    </tr>
  ) : null

export default QueueSkeletonRow
