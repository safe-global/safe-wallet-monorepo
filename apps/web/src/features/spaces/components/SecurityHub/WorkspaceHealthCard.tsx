import { type ReactElement, useMemo } from 'react'
import { Box, Chip, CircularProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { getSafeGrade, type SafeGrade } from '@/features/security/data/scanners/utils'
import { getStrengthLevel, getStrengthColor, type StrengthLevel } from '@/features/security/data/securityScoring'

type WorkspaceHealthCardProps = {
  scanResults: Record<string, Record<string, ScanResult>>
  isScanning: boolean
  activeFilter: SafeGrade | null
  onFilterChange: (grade: SafeGrade) => void
}

type Aggregate = {
  passing: number
  applicableCount: number
  criticalCount: number
  needsAttentionCount: number
  atRiskCount: number
  hasCriticalIssue: boolean
  level: StrengthLevel
  color: string
  scorePct: number
}

const computeAggregate = (scanResults: Record<string, Record<string, ScanResult>>): Aggregate | null => {
  let passing = 0
  let applicableCount = 0
  let criticalCount = 0
  let needsAttentionCount = 0
  let atRiskCount = 0
  let hasCriticalIssue = false
  let hasAny = false

  for (const safeResults of Object.values(scanResults)) {
    for (const result of Object.values(safeResults)) {
      if (result.status === 'not_applicable' || result.status === 'inconclusive') continue
      hasAny = true
      applicableCount++
      if (result.status === 'clear') passing++
      if (result.status === 'partial') needsAttentionCount++
      if (result.status === 'issue') atRiskCount++
      if (result.severity === 'Critical') {
        hasCriticalIssue = true
        criticalCount++
      }
    }
  }

  if (!hasAny) return null

  const clearRatio = applicableCount > 0 ? passing / applicableCount : 0
  const level = getStrengthLevel(clearRatio, hasCriticalIssue)
  const color = getStrengthColor(level)
  const scorePct = Math.round(clearRatio * 100)

  return {
    passing,
    applicableCount,
    criticalCount,
    needsAttentionCount,
    atRiskCount,
    hasCriticalIssue,
    level,
    color,
    scorePct,
  }
}

const ScoreGauge = ({ scorePct, color }: { scorePct: number; color: string }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CircularProgress variant="determinate" value={100} size={120} thickness={4} sx={{ color: 'border.light' }} />
    <CircularProgress
      variant="determinate"
      value={scorePct}
      size={120}
      thickness={4}
      sx={{
        color,
        position: 'absolute',
        left: 0,
        '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h3" fontWeight={700} sx={{ lineHeight: 1 }}>
        {scorePct}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        / 100
      </Typography>
    </Box>
  </Box>
)

const WorkspaceHealthCard = ({
  scanResults,
  isScanning,
  activeFilter,
  onFilterChange,
}: WorkspaceHealthCardProps): ReactElement => {
  const aggregate = useMemo(() => computeAggregate(scanResults), [scanResults])

  // Per-Safe grade counts for the filter chips
  const gradeCounts = useMemo(() => {
    const counts: Record<SafeGrade, number> = { critical: 0, at_risk: 0, needs_attention: 0, passing: 0 }
    for (const safeResults of Object.values(scanResults)) {
      counts[getSafeGrade(safeResults)]++
    }
    return counts
  }, [scanResults])

  // Show skeleton while the scan queue is running — a partial aggregate would be misleading.
  if (!aggregate || isScanning) {
    return (
      <Paper sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Skeleton variant="circular" width={120} height={120} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="rounded" width={180} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width={320} height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="rounded" width={260} height={16} sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={80} height={20} sx={{ borderRadius: '10px' }} />
              <Skeleton variant="rounded" width={100} height={20} sx={{ borderRadius: '10px' }} />
            </Stack>
          </Box>
        </Stack>
      </Paper>
    )
  }

  const { color, level, criticalCount, needsAttentionCount, atRiskCount, scorePct } = aggregate

  return (
    <Paper sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <ScoreGauge scorePct={scorePct} color={color} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700}>
              Workspace health
            </Typography>
            <Chip
              label={level}
              size="small"
              sx={{
                backgroundColor: color,
                color: 'background.paper',
                fontWeight: 700,
                letterSpacing: '0.5px',
                height: 18,
                fontSize: '0.65rem',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Aggregated score across all accounts based on signer setup, contract version, module configuration, and
            transaction activity.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {gradeCounts.passing > 0 && (
              <Chip
                label={`${gradeCounts.passing} Passing`}
                size="small"
                onClick={() => onFilterChange('passing')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  backgroundColor: activeFilter === 'passing' ? 'success.main' : 'success.background',
                  color: activeFilter === 'passing' ? 'background.paper' : 'success.main',
                }}
              />
            )}
            {gradeCounts.needs_attention > 0 && (
              <Chip
                label={`${gradeCounts.needs_attention} Needs attention`}
                size="small"
                onClick={() => onFilterChange('needs_attention')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  backgroundColor: activeFilter === 'needs_attention' ? 'warning.main' : 'warning.background',
                  color: activeFilter === 'needs_attention' ? 'background.paper' : 'warning.main',
                }}
              />
            )}
            {gradeCounts.at_risk > 0 && (
              <Chip
                label={`${gradeCounts.at_risk} At risk`}
                size="small"
                onClick={() => onFilterChange('at_risk')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  backgroundColor: activeFilter === 'at_risk' ? 'error.main' : 'error.background',
                  color: activeFilter === 'at_risk' ? 'background.paper' : 'error.main',
                }}
              />
            )}
            {gradeCounts.critical > 0 && (
              <Chip
                label={`${gradeCounts.critical} Critical`}
                size="small"
                onClick={() => onFilterChange('critical')}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  backgroundColor: activeFilter === 'critical' ? 'error.main' : 'error.background',
                  color: activeFilter === 'critical' ? 'background.paper' : 'error.main',
                }}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}

export default WorkspaceHealthCard
