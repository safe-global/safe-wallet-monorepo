import { forwardRef } from 'react'
import { TableRow } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
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

/**
 * Top-level `sx` for the Safes table — column borders, rounded row corners,
 * hover background, and inline typography overrides. Lives here so the main
 * file isn't dominated by inline style config.
 */
/** Wraps the table to enable horizontal scroll on viewports narrower than the table's min width. */
export const TABLE_WRAPPER_SX: SxProps<Theme> = {
  width: '100%',
  overflowX: 'auto',
}

export const TABLE_SX: SxProps<Theme> = {
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  borderSpacing: '0 6px',
  minWidth: 960,
  '& th': {
    border: 'none',
    borderBottom: 'none !important',
    py: 0.5,
    px: { xs: 1.25, md: 2.5 },
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'text.primary',
    opacity: 0.6,
  },
  '& td': {
    border: 'none',
    height: 72,
    py: 0,
    px: { xs: 1.25, md: 2.5 },
    backgroundColor: 'background.paper',
    transition: 'background-color 0.12s',
    verticalAlign: 'middle',
    '& .MuiTypography-body2': { fontWeight: 500, fontSize: '0.875rem' },
    '& .MuiTypography-caption': { fontSize: '0.75rem' },
  },
  '& tbody tr:hover td': {
    backgroundColor: 'success.background',
  },
  '& th:first-of-type': { pl: 0 },
  '& td:first-of-type': {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    pl: { xs: 1.5, md: 3 },
  },
  '& td:last-of-type': {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    pr: { xs: 3, md: 5 },
    overflow: 'hidden',
  },
  // Hide "Version" (5th col) on screens narrower than `md` — least essential security signal.
  '& th:nth-of-type(5), & td:nth-of-type(5)': {
    display: { xs: 'none', md: 'table-cell' },
  },
  // Hide "Last scanned" (8th col) on screens narrower than `lg` — useful but not critical.
  '& th:nth-of-type(8), & td:nth-of-type(8)': {
    display: { xs: 'none', lg: 'table-cell' },
  },
  // Hide "Balance" (3rd col) on screens narrower than `sm` so 13"-and-below has room.
  '& th:nth-of-type(3), & td:nth-of-type(3)': {
    display: { xs: 'none', sm: 'table-cell' },
  },
}

/**
 * Column widths for the Safes table header, in display order. Lives next to
 * `TABLE_SX` so the column layout config is colocated.
 */
export const COLUMNS: { label: string; width: string }[] = [
  { label: 'Account', width: '22%' },
  { label: 'Network', width: '11%' },
  { label: 'Balance', width: '9%' },
  { label: 'Threshold', width: '9%' },
  { label: 'Version', width: '8%' },
  { label: 'Status', width: '11%' },
  { label: 'Score', width: '10%' },
  { label: 'Last scanned', width: '11%' },
  { label: '', width: '9%' },
]
