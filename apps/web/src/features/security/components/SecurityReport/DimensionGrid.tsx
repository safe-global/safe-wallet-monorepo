import { type ReactElement, type ReactNode, useMemo } from 'react'
import { Grid2 as Grid } from '@mui/material'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { DIMENSION_DEFS } from '@/features/security/data/securityDimensions'
import DimensionCard from './DimensionCard'

export type CardOverride = {
  onCtaClick?: () => void
  ctaLabel?: string
  clearCtaLabel?: string
  title?: string
  description?: string
  logo?: ReactNode
}

type DimensionGridProps = {
  results: Record<string, ScanResult>
  loading: Record<string, boolean>
  cardOverrides?: Record<string, CardOverride>
}

const DimensionGrid = ({ results, loading, cardOverrides }: DimensionGridProps): ReactElement => {
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
          <DimensionCard def={def} result={result} isScanning={isScanning} override={cardOverrides?.[def.id]} />
        </Grid>
      ))}
    </Grid>
  )
}

export default DimensionGrid
