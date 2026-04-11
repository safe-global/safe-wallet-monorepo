import { type ReactElement, useMemo } from 'react'
import { Grid2 as Grid } from '@mui/material'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { DIMENSION_DEFS } from '@/features/security/data/securityDimensions'
import DimensionCard from './DimensionCard'

export type CtaOverride = {
  onCtaClick: () => void
  clearCtaLabel?: string
}

type DimensionGridProps = {
  results: Record<string, ScanResult>
  loading: Record<string, boolean>
  ctaOverrides?: Record<string, CtaOverride>
}

const DimensionGrid = ({ results, loading, ctaOverrides }: DimensionGridProps): ReactElement => {
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
      {dimensions.map(({ def, result, isScanning }) => {
        const override = ctaOverrides?.[def.id]
        return (
          <Grid key={def.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <DimensionCard
              def={def}
              result={result}
              isScanning={isScanning}
              onCtaClick={override?.onCtaClick}
              clearCtaLabel={override?.clearCtaLabel}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}

export default DimensionGrid
