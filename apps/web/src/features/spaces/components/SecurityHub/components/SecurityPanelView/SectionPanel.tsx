import type { ReactElement, ReactNode } from 'react'
import { Box, Divider, Paper, Typography } from '@mui/material'
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
 * Animated section container used by every panel section (signers + checks).
 * Renders nothing when there are no rows and no footer so empty sections collapse.
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
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 700,
          display: 'block',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {rows.map((r, idx) => (
          <MotionBox
            key={r.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: baseDelay + (idx + 1) * ROW_STAGGER }}
          >
            {idx > 0 && <Divider />}
            {r.node}
          </MotionBox>
        ))}
        {footer && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: baseDelay + (rows.length + 1) * ROW_STAGGER }}
          >
            {footer}
          </MotionBox>
        )}
      </Paper>
    </MotionBox>
  )
}

export default SectionPanel
