import { type ReactElement, type ReactNode, useMemo } from 'react'
import { Grid2 as Grid, Typography } from '@mui/material'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { CHECK_DEFS, type CheckCategory, type CheckDef } from '@/features/security/data/securityChecks'
import CheckCard from './CheckCard'

export type CardOverride = {
  onCtaClick?: () => void
  ctaLabel?: string
  clearCtaLabel?: string
  title?: string
  description?: string
  logo?: ReactNode
}

type CheckGridProps = {
  results: Record<string, ScanResult>
  loading: Record<string, boolean>
  errors?: Record<string, string>
  cardOverrides?: Record<string, CardOverride>
  checkFilter?: (def: CheckDef) => boolean
}

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  account: 'Account checks',
  user: 'Personal checks',
}

const CATEGORY_ORDER: CheckCategory[] = ['account', 'user']

const CheckGrid = ({ results, loading, errors, cardOverrides, checkFilter }: CheckGridProps): ReactElement => {
  const grouped = useMemo(() => {
    const defs = Object.values(CHECK_DEFS).filter((def) => !checkFilter || checkFilter(def))

    const groups: Partial<Record<CheckCategory, typeof defs>> = {}
    for (const def of defs) {
      const cat = def.category
      ;(groups[cat] ??= []).push(def)
    }

    return CATEGORY_ORDER.filter((cat) => groups[cat] && groups[cat].length > 0).map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      defs: groups[cat]!,
    }))
  }, [checkFilter])

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
                <CheckCard
                  def={def}
                  result={results[def.id]}
                  isScanning={loading[def.id] ?? false}
                  error={errors?.[def.id]}
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

export default CheckGrid
