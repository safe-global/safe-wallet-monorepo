import { type ReactElement, type ReactNode, useMemo } from 'react'
import { Grid2 as Grid, Typography } from '@mui/material'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { DIMENSION_DEFS, type DimensionCategory, type DimensionDef } from '@/features/security/data/securityDimensions'
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
  dimensionFilter?: (def: DimensionDef) => boolean
}

const CATEGORY_LABELS: Record<DimensionCategory, string> = {
  account: 'Account checks',
  user: 'Personal checks',
}

const CATEGORY_ORDER: DimensionCategory[] = ['account', 'user']

const DimensionGrid = ({ results, loading, cardOverrides, dimensionFilter }: DimensionGridProps): ReactElement => {
  const grouped = useMemo(() => {
    const defs = Object.values(DIMENSION_DEFS).filter((def) => !dimensionFilter || dimensionFilter(def))

    const groups: Partial<Record<DimensionCategory, typeof defs>> = {}
    for (const def of defs) {
      const cat = def.category
      ;(groups[cat] ??= []).push(def)
    }

    return CATEGORY_ORDER.filter((cat) => groups[cat] && groups[cat].length > 0).map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      defs: groups[cat]!,
    }))
  }, [dimensionFilter])

  return (
    <>
      {grouped.map(({ category, label, defs }) => (
        <div key={category}>
          {grouped.length > 1 && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, mt: 2 }}>
              {label}
            </Typography>
          )}
          <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
            {defs.map((def) => (
              <Grid key={def.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <DimensionCard
                  def={def}
                  result={results[def.id]}
                  isScanning={loading[def.id] ?? false}
                  override={cardOverrides?.[def.id]}
                />
              </Grid>
            ))}
          </Grid>
        </div>
      ))}
    </>
  )
}

export default DimensionGrid
