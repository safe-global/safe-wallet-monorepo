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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'var(--color-yellow-800)' }}>
        <TriangleAlert size={16} aria-hidden />
        <Typography variant="caption" fontWeight={600}>
          Address poisoning warning
        </Typography>
        <Info size={14} aria-hidden />
      </Box>
    </TableCell>
  </TableRow>
)
