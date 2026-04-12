import { type ReactElement, useMemo } from 'react'
import { Button, Chip, LinearProgress, Paper, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { getStrengthLevel, getStrengthColor, getGradeBgColor, getGrade } from '@/features/security/data/securityScoring'
import { formatTimestamp } from '@/features/security/data/scanners/utils'

type SecurityStrengthBarProps = {
  results: Record<string, ScanResult>
  isComplete: boolean
  lastScannedAt: number | null
  onRescan?: () => void
}

const SecurityStrengthBar = ({
  results,
  isComplete,
  lastScannedAt,
  onRescan,
}: SecurityStrengthBarProps): ReactElement => {
  const { clearCount, applicableCount, total, clearRatio, level, color } = useMemo(() => {
    const entries = Object.values(results)
    const total = entries.length
    const applicable = entries.filter((r) => r.status !== 'not_applicable')
    const applicableCount = applicable.length
    const clearCount = applicable.filter((r) => r.status === 'clear').length
    const clearRatio = applicableCount > 0 ? clearCount / applicableCount : 0
    const hasCriticalIssue = applicable.some((r) => r.severity === 'Critical')
    const level = getStrengthLevel(clearRatio, hasCriticalIssue)
    const color = getStrengthColor(level)
    return { clearCount, applicableCount, total, clearRatio, level, color }
  }, [results])

  if (!isComplete && total === 0) {
    return (
      <Paper sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
        <Skeleton width={180} height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={10} sx={{ borderRadius: 5 }} />
      </Paper>
    )
  }

  const grade = getGrade(clearRatio)

  return (
    <Paper sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h5" fontWeight={700}>
            Overall setup strength
          </Typography>
          <Chip
            label={level}
            size="small"
            sx={{
              backgroundColor: getGradeBgColor(grade),
              color,
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          />
        </Stack>
        {onRescan && (
          <Tooltip title="Re-scan all checks">
            <span>
              <Button
                variant="text"
                size="small"
                startIcon={<RefreshRoundedIcon />}
                onClick={onRescan}
                disabled={!isComplete}
                sx={{ pr: 0 }}
              >
                {isComplete ? 'Re-scan all' : 'Scanning...'}
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.round(clearRatio * 100)}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: 'border.light',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            background: 'linear-gradient(90deg, #12FF80, #00BFE5)',
          },
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
        <Typography variant="caption" color="text.secondary">
          {clearCount}/{applicableCount} checks passing
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {lastScannedAt ? `Last scan: ${formatTimestamp(lastScannedAt)}` : ''}
        </Typography>
      </Stack>
    </Paper>
  )
}

export default SecurityStrengthBar
