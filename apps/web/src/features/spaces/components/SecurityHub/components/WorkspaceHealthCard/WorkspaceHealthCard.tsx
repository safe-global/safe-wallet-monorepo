import { type ReactElement, useMemo } from 'react'
import { Box, Chip, CircularProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import type { ScanResult, SafeGrade, StrengthLevel } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import SafeGradeChip, { SAFE_GRADE_LABEL } from '../SafeGradeChip/SafeGradeChip'
import type { SpaceSafeEntry } from '../../types'

const FILTER_GRADES: SafeGrade[] = ['critical', 'at_risk', 'needs_attention', 'passing']

type WorkspaceHealthCardProps = {
  safes: SpaceSafeEntry[]
  scanResults: Record<string, Record<string, ScanResult>>
  isScanning: boolean
  activeFilter: SafeGrade | null
  onFilterChange: (grade: SafeGrade) => void
  lastScannedAt: number | null
  onRescan: () => void
}

type AggregateCounts = {
  passing: number
  applicableCount: number
  criticalCount: number
  needsAttentionCount: number
  atRiskCount: number
  hasCriticalIssue: boolean
}

type Aggregate = AggregateCounts & {
  level: StrengthLevel
  color: string
  scorePct: number
}

// Pure reducer — no feature-service calls. The strength level/color are derived
// inside the component where useLoadFeature gives access to the scoring utils.
const computeCounts = (scanResults: Record<string, Record<string, ScanResult>>): AggregateCounts | null => {
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

  return { passing, applicableCount, criticalCount, needsAttentionCount, atRiskCount, hasCriticalIssue }
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
  safes,
  scanResults,
  isScanning,
  activeFilter,
  onFilterChange,
  lastScannedAt,
  onRescan,
}: WorkspaceHealthCardProps): ReactElement => {
  const security = useLoadFeature(SecurityFeature)

  const aggregate = useMemo<Aggregate | null>(() => {
    const counts = computeCounts(scanResults)
    if (!counts || !security.$isReady) return null
    const clearRatio = counts.applicableCount > 0 ? counts.passing / counts.applicableCount : 0
    const level = security.getStrengthLevel(clearRatio, counts.hasCriticalIssue)
    const color = security.getStrengthColor(level)
    return { ...counts, level, color, scorePct: Math.round(clearRatio * 100) }
  }, [scanResults, security.$isReady, security.getStrengthLevel, security.getStrengthColor])

  // Per-Safe grade counts for the filter chips.
  // Iterate over `safes` (not scanResults) so multichain safes are counted once per
  // distinct grade — not once per chain entry. This keeps chip counts consistent with
  // the table's filter semantics ("show safes where ANY chain matches this grade").
  const gradeCounts = useMemo(() => {
    const counts: Record<SafeGrade, number> = { critical: 0, at_risk: 0, needs_attention: 0, passing: 0 }
    if (!security.$isReady) return counts
    for (const safe of safes) {
      const gradesFound = new Set<SafeGrade>()
      for (const chain of safe.chainEntries) {
        const key = security.scanKey(safe.address, chain.chainId)
        const results = scanResults[key]
        if (!results) continue
        gradesFound.add(security.getSafeGrade(results))
      }
      for (const grade of gradesFound) counts[grade]++
    }
    return counts
  }, [safes, scanResults, security.$isReady, security.scanKey, security.getSafeGrade])

  // Show skeleton only when we have no data at all. Once any Safe has completed, render the
  // aggregate incrementally — it updates as more results arrive. The re-scan row below
  // surfaces the in-progress state via its "Scanning..." label.
  if (!aggregate) {
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

  const { color, level, scorePct } = aggregate

  return (
    <Paper sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <ScoreGauge scorePct={scorePct} color={color} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700}>
              Security score
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
            Combined score from all security checks across your accounts.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {FILTER_GRADES.filter((grade) => gradeCounts[grade] > 0).map((grade) => (
              <SafeGradeChip
                key={grade}
                grade={grade}
                active={activeFilter === grade}
                label={`${gradeCounts[grade]} ${SAFE_GRADE_LABEL[grade]}`}
                onClick={() => onFilterChange(grade)}
                sx={{ '& .MuiChip-root:active, & .MuiTouchRipple-root': { display: 'none' } }}
              />
            ))}
          </Stack>

          {lastScannedAt && (
            <Stack direction="row" alignItems="center" spacing={0.5} mt={2}>
              <Typography variant="caption" color="text.secondary">
                Last scanned {security.$isReady ? security.formatTimestamp(lastScannedAt) : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ·
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                onClick={isScanning ? undefined : onRescan}
                sx={{
                  cursor: isScanning ? 'default' : 'pointer',
                  color: isScanning ? 'text.disabled' : 'primary.main',
                  '&:hover': isScanning ? {} : { color: 'primary.dark' },
                }}
              >
                <RefreshRoundedIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight={700} sx={{ color: 'inherit' }}>
                  {isScanning ? 'Scanning...' : 'Re-scan'}
                </Typography>
              </Stack>
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  )
}

export default WorkspaceHealthCard
