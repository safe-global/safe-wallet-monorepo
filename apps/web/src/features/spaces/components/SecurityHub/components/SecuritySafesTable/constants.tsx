import { forwardRef } from 'react'
import { TableRow } from '@mui/material'
import { motion } from 'framer-motion'

/** Em-dash glyph used wherever a cell has no value to display. */
export const DASH = '—'

/** Row enter animation used by the table body. */
export const ROW_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

/**
 * `motion.create` on TableRow + tbody. Wrapping TableRow in a forwardRef is required
 * for framer-motion to attach its imperative animation refs to the underlying DOM node.
 */
export const MotionTableRow = motion.create(
  forwardRef<HTMLTableRowElement, React.ComponentProps<typeof TableRow>>(function MotionTableRowInner(props, ref) {
    return <TableRow ref={ref} {...props} />
  }),
)

export const MotionTbody = motion.create('tbody')
