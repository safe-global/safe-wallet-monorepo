import { type ReactElement, useMemo } from 'react'
import { Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { getStrengthLevel, getStrengthColor, type StrengthLevel } from '@/features/security/data/securityScoring'

type WorkspaceHealthCardProps = {
  scanResults: Record<string, Record<string, ScanResult>>
  totalDeployedTargets: number
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

const WorkspaceHealthCard = ({ scanResults, totalDeployedTargets }: WorkspaceHealthCardProps): ReactElement => {
  const aggregate = useMemo(() => computeAggregate(scanResults), [scanResults])
  const scannedCount = Object.keys(scanResults).length
  const isScanning = scannedCount < totalDeployedTargets

  // Show loading state until ALL scans complete — a partial aggregate would be misleading.
  if (!aggregate || isScanning) {
    return (
      <Paper sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <CircularProgress size={80} thickness={4} sx={{ color: 'border.light' }} />
          <Box>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Workspace health
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scanning your accounts...
            </Typography>
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
            Based on threshold adequacy, signer diversity, version currency, factory provenance, and signing activity
            across all your accounts.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {criticalCount > 0 && (
              <Chip
                label={`${criticalCount} Critical`}
                size="small"
                sx={{ backgroundColor: 'error.background', color: 'error.main', fontWeight: 700 }}
              />
            )}
            {atRiskCount > 0 && (
              <Chip
                label={`${atRiskCount} At risk`}
                size="small"
                sx={{ backgroundColor: 'error.background', color: 'error.main', fontWeight: 700 }}
              />
            )}
            {needsAttentionCount > 0 && (
              <Chip
                label={`${needsAttentionCount} Needs attention`}
                size="small"
                sx={{ backgroundColor: 'warning.background', color: 'warning.main', fontWeight: 700 }}
              />
            )}
            {criticalCount === 0 && atRiskCount === 0 && needsAttentionCount === 0 && (
              <Chip
                label="All checks passing"
                size="small"
                sx={{ backgroundColor: 'success.background', color: 'success.main', fontWeight: 700 }}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}

export default WorkspaceHealthCard
