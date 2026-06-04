import { Box, Skeleton, Stack, Typography } from '@mui/material'
import type { GradeSummary, ScanResult } from '@/features/security/types'
import type { SecurityContract } from '@/features/security'
import { DASH } from './constants'
import { countChecks, formatBalance, type CheckCounts } from './utils'

type ScoreCellProps = {
  summary: GradeSummary | null
  isScanning?: boolean
  getStrengthLevel: SecurityContract['getStrengthLevel']
  getStrengthColor: SecurityContract['getStrengthColor']
}

/** Numeric score (0–100) + colored dot reflecting the strength level. */
export const ScoreCell = ({ summary, isScanning, getStrengthLevel, getStrengthColor }: ScoreCellProps) => {
  if (!summary) {
    if (isScanning) return <Skeleton variant="rounded" width={60} height={20} />
    return (
      <Typography variant="body2" color="text.secondary">
        {DASH}
      </Typography>
    )
  }
  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)
  const level = getStrengthLevel(clearRatio, summary.hasCriticalIssue)
  const color = getStrengthColor(level)

  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" fontWeight={600}>
        {score}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        / 100
      </Typography>
    </Stack>
  )
}

/** Presentational failed/warning tally (e.g. "1 failed  2 warnings"); dash when all clear. */
export const ChecksCount = ({ failed, warnings }: CheckCounts) => {
  if (!failed && !warnings) {
    return (
      <Typography variant="body2" color="text.secondary">
        {DASH}
      </Typography>
    )
  }
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      {failed > 0 && (
        <Typography variant="body2" color="text.secondary" noWrap>
          {failed} failed
        </Typography>
      )}
      {warnings > 0 && (
        <Typography variant="body2" color="text.secondary" noWrap>
          {warnings} warning{warnings === 1 ? '' : 's'}
        </Typography>
      )}
    </Stack>
  )
}

/** Failed/warning tally for a single Safe's scan results. */
export const ChecksCell = ({ results, isScanning }: { results?: Record<string, ScanResult>; isScanning?: boolean }) => {
  if (!results && isScanning) return <Skeleton variant="rounded" width={70} height={20} />
  return <ChecksCount {...countChecks(results)} />
}

/** Compact fiat balance ($1.2K / $3.4M / dash when zero or missing). */
export const BalanceCell = ({ value, isScanning }: { value?: string; isScanning?: boolean }) => (
  <Typography variant="body2" color="text.primary">
    {!value && isScanning ? <Skeleton variant="rounded" width={50} height={20} /> : formatBalance(value)}
  </Typography>
)
