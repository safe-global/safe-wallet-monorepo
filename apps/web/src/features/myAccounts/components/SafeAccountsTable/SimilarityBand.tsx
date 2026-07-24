import type { ReactElement } from 'react'
import Box from '@mui/material/Box'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { TriangleAlert, Info } from 'lucide-react'

/**
 * Full-width header row that opens an address-poisoning similarity band. The band tint + per-card
 * borders live in the Table sx (keyed off the `data-band-header` / `data-highlighted` attributes)
 * so they compose with the cell-level hover/separator machinery.
 */
export const SimilarityBandHeader = ({ colSpan }: { colSpan: number }) => (
  <TableRow data-band-header="">
    <TableCell colSpan={colSpan} sx={{ py: 0.75, px: 2 }}>
      {/* Warning accent flips with the theme: dark amber-yellow on the light band, coral on the dark band. */}
      <Box
        className="text-yellow-800 dark:text-[var(--color-warning-main)]"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
      >
        <TriangleAlert size={16} aria-hidden />
        <Typography variant="caption" fontWeight={600} color="inherit">
          Address poisoning warning
        </Typography>
        <Info size={14} aria-hidden />
      </Box>
    </TableCell>
  </TableRow>
)

/**
 * The band-opening header for the row at `index`, or null if it doesn't start a new contiguous cluster
 * run. `clusterIdAt` maps a row index → its cluster id (undefined = not in a band). Shared by both the
 * non-reorder body and the reorderable pinned block so the "open a band once per run" rule lives once.
 */
export const bandHeaderAt = (
  index: number,
  clusterIdAt: (index: number) => string | undefined,
  colSpan: number,
): ReactElement | null => {
  const clusterId = clusterIdAt(index)
  if (!clusterId) return null
  const previous = index > 0 ? clusterIdAt(index - 1) : undefined
  return clusterId === previous ? null : <SimilarityBandHeader key={`band-${clusterId}`} colSpan={colSpan} />
}
