import { type ReactElement, useMemo } from 'react'
import { Grid2 as Grid } from '@mui/material'
import type { ScanResult } from '@/features/spaces/data/scanners/types'
import { DIMENSION_DEFS } from '@/features/spaces/data/securityDimensions'
import DimensionCard from './DimensionCard'

type DimensionGridProps = {
  results: Record<string, ScanResult>
  loading: Record<string, boolean>
  onRescan?: (id: string) => void
}

const DimensionGrid = ({ results, loading, onRescan }: DimensionGridProps): ReactElement => {
  const dimensions = useMemo(
    () =>
      Object.values(DIMENSION_DEFS).map((def) => ({
        def,
        result: results[def.id],
        isScanning: loading[def.id] ?? false,
      })),
    [results, loading],
  )

  return (
    <Grid container spacing={2} alignItems="flex-start">
      {dimensions.map(({ def, result, isScanning }) => (
        <Grid key={def.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <DimensionCard def={def} result={result} isScanning={isScanning} onRescan={onRescan} />
        </Grid>
      ))}
    </Grid>
  )
}

export default DimensionGrid
