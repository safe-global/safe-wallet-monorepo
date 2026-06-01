import type { ReactElement, ReactNode } from 'react'
import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { ROW_STAGGER } from './constants'

const MotionBox = motion.create(Box)

export type SectionPanelProps = {
  title: string
  rows: { key: string; node: ReactNode }[]
  footer?: ReactNode
  /** Base delay offset so sections appearing later start their stagger later. */
  baseDelay?: number
}

/**
 * Section container — quiet heading + flat list of rows separated by hairline dividers.
 *
 * Intentionally NOT a bordered card: the surrounding drawer already provides containment,
 * and per-section borders made the panel feel boxy. The rows themselves carry the structure
 * via hover + divider rhythm (Linear-style).
 */
const SectionPanel = ({ title, rows, footer, baseDelay = 0 }: SectionPanelProps): ReactElement | null => {
  if (rows.length === 0 && !footer) return null
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: baseDelay }}
      sx={{ mb: 3 }}
    >
      <Box
        component="h3"
        sx={{
          m: 0,
          mb: 1.5,
          fontSize: '0.8125rem',
          fontWeight: 600,
          letterSpacing: '-0.005em',
          color: 'text.primary',
        }}
      >
        {title}
      </Box>
      <Box>
        {rows.map((r, idx) => (
          <MotionBox
            key={r.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: baseDelay + (idx + 1) * ROW_STAGGER }}
            sx={{
              borderTop: idx > 0 ? '1px solid var(--color-border-light)' : 0,
            }}
          >
            {r.node}
          </MotionBox>
        ))}
        {footer && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: baseDelay + (rows.length + 1) * ROW_STAGGER }}
            sx={{
              borderTop: rows.length > 0 ? '1px solid var(--color-border-light)' : 0,
            }}
          >
            {footer}
          </MotionBox>
        )}
      </Box>
    </MotionBox>
  )
}

export default SectionPanel
