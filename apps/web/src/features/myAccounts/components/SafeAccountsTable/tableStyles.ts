import type { SxProps, Theme } from '@mui/material/styles'

// The base MUI theme pins row/cell styles at a specificity only these table-level selectors beat.
const ROW = '& .MuiTableBody-root .MuiTableRow-root'
const CELL = `${ROW} .MuiTableCell-root`

/**
 * Body-row styling: grey hover pill, inset separators, and the similarity band. Table-level because
 * per-cell sx can't beat the base theme; rule order is load-bearing (band rules must follow hover).
 */
export const bodyRowSx = {
  // Theme-adaptive band palette (light: yellow surface/border; dark: warning-brown/coral).
  '--band-surface': 'var(--color-yellow-50)',
  '--band-border': 'var(--color-yellow-400)',
  '.dark &': {
    '--band-surface': 'var(--color-warning-background)',
    '--band-border': 'var(--color-warning-main)',
  },

  // Suppress the theme's row hover tint (bleeds into the inset corners); paint a grey pill on the
  // cells instead — cell-level fill lets the transparent side borders inset it from the panel edges.
  [`${ROW}:hover`]: { backgroundColor: 'transparent' },
  [`${ROW}:not([data-disabled]):hover .MuiTableCell-root`]: { backgroundColor: 'var(--muted)' },
  [`${ROW}:not([data-disabled]):hover .MuiTableCell-root:first-of-type`]: {
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
  },
  [`${ROW}:not([data-disabled]):hover .MuiTableCell-root:last-of-type`]: {
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
  },

  // Transparent borders + background-clip float the hover pill clear of the separators. Must live
  // here: the base theme forces cell borderBottom to `none` at a specificity per-cell sx can't beat.
  [CELL]: {
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
    backgroundClip: 'padding-box',
  },

  // 1px bottom separator (data-divider is absent on the last row), inset 4px to align with the pill.
  [`${ROW}[data-divider]`]: {
    backgroundImage:
      'linear-gradient(to right, transparent 4px, var(--color-border-light) 4px, var(--color-border-light) calc(100% - 4px), transparent calc(100% - 4px))',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'bottom',
    backgroundSize: '100% 1px',
  },
  // Band cards separate themselves — suppress the grey divider inside a band.
  [`${ROW}[data-highlighted]`]: { backgroundImage: 'none' },

  // Band surface for header + member rows (incl. the inset borders) so the run reads as one block.
  // Must sit AFTER the hover rule — same specificity, later wins.
  [`${ROW}[data-band-header] .MuiTableCell-root, ${ROW}[data-highlighted] .MuiTableCell-root`]: {
    backgroundColor: 'var(--band-surface)',
    borderTopColor: 'var(--band-surface)',
    borderBottomColor: 'var(--band-surface)',
  },
  // Keep the band surface on hover (beats the equal-specificity grey pill).
  [`${ROW}[data-band-header]:hover .MuiTableCell-root, ${ROW}[data-highlighted]:hover .MuiTableCell-root`]: {
    backgroundColor: 'var(--band-surface)',
  },

  // Each band member is a rounded band-bordered card: inset box-shadows (sides only on the outer
  // cells) follow the cell radii without drawing internal vertical lines.
  [`${ROW}[data-highlighted] .MuiTableCell-root`]: {
    boxShadow: 'inset 0 1px 0 var(--band-border), inset 0 -1px 0 var(--band-border)',
  },
  [`${ROW}[data-highlighted] .MuiTableCell-root:first-of-type`]: {
    boxShadow: 'inset 1px 0 0 var(--band-border), inset 0 1px 0 var(--band-border), inset 0 -1px 0 var(--band-border)',
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
  },
  [`${ROW}[data-highlighted] .MuiTableCell-root:last-of-type`]: {
    boxShadow: 'inset -1px 0 0 var(--band-border), inset 0 1px 0 var(--band-border), inset 0 -1px 0 var(--band-border)',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
  },
} satisfies SxProps<Theme>
