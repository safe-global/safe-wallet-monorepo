import type { SxProps, Theme } from '@mui/material/styles'

// Every body rule needs this full chain: the base MUI theme pins row/cell styles (hover tint, cell
// borders) at a specificity only the table-level `& .MuiTableBody-root …` selector can beat.
const ROW = '& .MuiTableBody-root .MuiTableRow-root'
const CELL = `${ROW} .MuiTableCell-root`

/**
 * Body-row styling for the accounts table: a rounded grey hover pill, inset row separators, and the
 * address-poisoning similarity band. Lives at the table level (not per-cell) because the base theme
 * forces cell borders at a specificity per-cell sx can't override. Rule order is load-bearing —
 * same-specificity band rules sit after the hover rule so they win.
 */
export const bodyRowSx = {
  // Similarity-band palette, theme-adaptive like the SecurityBanner: light = the Figma yellow surface
  // + yellow border; dark = the warning-brown surface + coral border. Every band rule reads these.
  '--band-surface': 'var(--color-yellow-50)',
  '--band-border': 'var(--color-yellow-400)',
  '.dark &': {
    '--band-surface': 'var(--color-warning-background)',
    '--band-border': 'var(--color-warning-main)',
  },

  // The base theme tints every row green on hover; suppress it on the <tr> (it bleeds into the inset
  // corners) and instead paint a grey pill (the same --muted as the safe-selector dropdown) on the
  // cells — painting cells, not the <tr>, lets the outer cells' transparent side borders inset the
  // fill from the panel edges. Locked rows stay un-hovered.
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

  // Transparent top/bottom borders (with background-clip) inset the hover pill vertically so it floats
  // clear of the separators. Set here — not per-cell — because the base theme forces cell borderBottom
  // to `none` at a specificity a per-cell sx can't beat.
  [CELL]: {
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
    backgroundClip: 'padding-box',
  },

  // Row separator, drawn as a 1px line at the bottom of the <tr> (keyed off data-divider, absent on the
  // last row) so the cells' transparent borders can inset the hover pill clear of it. Inset 4px to
  // line up with the pill.
  [`${ROW}[data-divider]`]: {
    backgroundImage:
      'linear-gradient(to right, transparent 4px, var(--color-border-light) 4px, var(--color-border-light) calc(100% - 4px), transparent calc(100% - 4px))',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'bottom',
    backgroundSize: '100% 1px',
  },
  // Inside a band, cards are separated by their own borders + the surface gap — suppress the grey row
  // divider so no line paints through the gap between cards (both render paths).
  [`${ROW}[data-highlighted]`]: { backgroundImage: 'none' },

  // Paint the band header + member rows with the band surface (incl. the 6px inset borders) so the run
  // reads as one continuous block. After the hover rule so this same-specificity override wins.
  [`${ROW}[data-band-header] .MuiTableCell-root, ${ROW}[data-highlighted] .MuiTableCell-root`]: {
    backgroundColor: 'var(--band-surface)',
    borderTopColor: 'var(--band-surface)',
    borderBottomColor: 'var(--band-surface)',
  },
  // Keep the band surface on hover (beat the grey hover pill, which has equal specificity).
  [`${ROW}[data-band-header]:hover .MuiTableCell-root, ${ROW}[data-highlighted]:hover .MuiTableCell-root`]: {
    backgroundColor: 'var(--band-surface)',
  },

  // Every band member (incl. the trusted anchor) renders as its own rounded, band-bordered card. The
  // border is drawn with inset box-shadows on the cells (continuous top/bottom on every cell; left only
  // on the first, right only on the last) so it follows the first/last cell radii into a rounded
  // rectangle with no internal vertical lines.
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
