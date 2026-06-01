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
  borderCollapse: 'collapse',
  width: '100%',
  minWidth: 960,
  // Header: muted, uppercase, hairline bottom divider — Linear-style.
  '& th': {
    borderTop: 0,
    borderRight: 0,
    borderLeft: 0,
    borderBottom: '1px solid var(--color-border-light)',
    py: 1.25,
    px: { xs: 1.5, md: 2.5 },
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: 'text.secondary',
    backgroundColor: 'transparent',
    textAlign: 'left',
  },
  // Body cells: flat, hairline divider, tighter row height, no per-row card chrome.
  '& tbody td': {
    borderTop: 0,
    borderRight: 0,
    borderLeft: 0,
    borderBottom: '1px solid var(--color-border-light)',
    height: 60,
    py: 0,
    px: { xs: 1.5, md: 2.5 },
    backgroundColor: 'transparent',
    transition: 'background-color 0.12s',
    verticalAlign: 'middle',
    '& .MuiTypography-body2': { fontWeight: 500, fontSize: '0.875rem' },
    '& .MuiTypography-caption': { fontSize: '0.75rem' },
  },
  // Last row drops its divider so it sits flush against the card bottom.
  '& tbody tr:last-of-type td': {
    borderBottom: 0,
  },
  // Subtle row hover, full-row.
  '& tbody tr:hover td': {
    backgroundColor: 'action.hover',
  },
  // Expanded multichain parent reads as "active/open" — slightly stronger than hover,
  // persists while the group is expanded so the state is unmistakable.
  '& tbody tr[data-expanded-parent="true"] td': {
    backgroundColor: 'action.selected',
  },
  // Edge padding to align with the card's inner padding rhythm.
  '& th:first-of-type, & tbody td:first-of-type': {
    pl: { xs: 2, md: 3 },
  },
  '& th:last-of-type, & tbody td:last-of-type': {
    pr: { xs: 2, md: 3 },
  },
  // Child rows under an expanded multichain parent: subtle left rail for hierarchy,
  // muted divider (vs. a sibling divider), and a slight inset on the first cell so
  // the connection to the parent reads as a tree branch, not another sibling row.
  '& tbody tr[data-child-row="true"] td:first-of-type': {
    boxShadow: 'inset 2px 0 0 0 var(--color-border-light)',
  },
  '& tbody tr[data-child-row="true"][data-last-child="true"] td': {
    borderBottomStyle: 'solid', // keep divider — visually closes the group
  },
  // Hide "Version" (5th col) on screens narrower than `md` — least essential security signal.
  '& th:nth-of-type(5), & td:nth-of-type(5)': {
    display: { xs: 'none', md: 'table-cell' },
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
  { label: 'Account', width: '26%' },
  { label: 'Network', width: '12%' },
  { label: 'Balance', width: '11%' },
  { label: 'Threshold', width: '11%' },
  { label: 'Version', width: '10%' },
  { label: 'Status', width: '13%' },
  { label: 'Score', width: '12%' },
  { label: '', width: '5%' },
]
