import type { ReactElement, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ROW_STAGGER } from './constants'

export type SectionPanelProps = {
  rows: { key: string; node: ReactNode }[]
  /** Base delay offset so sections appearing later start their stagger later. */
  baseDelay?: number
}

/**
 * Animated section container used by every panel section (signers + checks).
 * Renders nothing when there are no rows so empty sections collapse.
 */
const SectionPanel = ({ rows, baseDelay = 0 }: SectionPanelProps): ReactElement | null => {
  if (rows.length === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: baseDelay }}
      className="mb-6 flex flex-col gap-1"
    >
      {rows.map((r, idx) => (
        <motion.div
          key={r.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: baseDelay + (idx + 1) * ROW_STAGGER }}
          className="overflow-hidden rounded-lg bg-card"
        >
          {r.node}
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SectionPanel
