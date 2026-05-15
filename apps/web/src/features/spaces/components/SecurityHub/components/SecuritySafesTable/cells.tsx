import { Box, Skeleton, Stack, Typography } from '@mui/material'
import type { GradeSummary, ScanResult } from '@/features/security/types'
import type { SecurityContract } from '@/features/security'
import { DASH } from './constants'
import { formatBalance, getEvidence } from './utils'

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

type ResultsCellProps = { results?: Record<string, ScanResult>; isScanning?: boolean }

/** Threshold from `account_setup` scanner evidence (e.g. "2 of 3"). */
export const ThresholdCell = ({ results, isScanning }: ResultsCellProps) => {
  if (!results && isScanning) return <Skeleton variant="rounded" width={50} height={20} />
  const threshold = getEvidence(results, 'account_setup', 'Threshold')
  return (
    <Typography variant="body2" color="text.primary">
      {threshold ?? DASH}
    </Typography>
  )
}

/** Contract version from `contract_version` scanner evidence (e.g. "1.4.1"). */
export const VersionCell = ({ results, isScanning }: ResultsCellProps) => {
  if (!results && isScanning) return <Skeleton variant="rounded" width={50} height={20} />
  const version = getEvidence(results, 'contract_version', 'Current version')
  return (
    <Typography variant="body2" color="text.primary">
      {version ?? DASH}
    </Typography>
  )
}

/** Compact fiat balance ($1.2K / $3.4M / dash when zero or missing). */
export const BalanceCell = ({ value, isScanning }: { value?: string; isScanning?: boolean }) => (
  <Typography variant="body2" color="text.primary">
    {!value && isScanning ? <Skeleton variant="rounded" width={50} height={20} /> : formatBalance(value)}
  </Typography>
)
