import { type ReactElement, useEffect } from 'react'
import { Box, Button, Chip, Fade, LinearProgress, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import useSecurityScan from '@/features/spaces/hooks/useSecurityScan'
import type { ScanContext, ScanResult } from '@/features/spaces/data/scanners/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import DimensionGrid from './DimensionGrid'

type SecurityReportProps = {
  safeAddress: string
  safeName?: string
  chainId: string
  scanContext: ScanContext | null
  onScanComplete?: (
    safeAddress: string,
    chainId: string,
    timestamp: number,
    results: Record<string, ScanResult>,
  ) => void
}

const SecurityReport = ({
  safeAddress,
  safeName,
  chainId,
  scanContext,
  onScanComplete,
}: SecurityReportProps): ReactElement => {
  const { results, loading, isComplete, lastScannedAt, progress, rescan, rescanOne } = useSecurityScan(scanContext)

  useEffect(() => {
    if (isComplete && lastScannedAt && onScanComplete) {
      onScanComplete(safeAddress, chainId, lastScannedAt, results)
    }
    // Only fire when scan completes — not on every partial result update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, lastScannedAt])

  // Show loading skeleton while fetching Safe data (scanContext is null)
  if (!scanContext) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton width={200} height={28} />
        </Stack>
        <Skeleton variant="rectangular" height={4} sx={{ borderRadius: 2, mb: 2 }} />
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rectangular" width="33%" height={160} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" width="33%" height={160} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" width="33%" height={160} sx={{ borderRadius: '12px' }} />
        </Stack>
      </Box>
    )
  }

  return (
    <Fade in timeout={300}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={2}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              Security checks
            </Typography>
            <Chip
              label={safeName || shortenAddress(safeAddress)}
              size="small"
              sx={{
                backgroundColor: 'border.light',
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 22,
                position: 'relative',
                top: -1,
              }}
            />
          </Stack>
          <Tooltip title="Re-run all checks">
            <span>
              <Button variant="text" size="small" startIcon={<RefreshIcon />} onClick={rescan} disabled={!isComplete}>
                {isComplete ? 'Re-check all' : 'Checking...'}
              </Button>
            </span>
          </Tooltip>
        </Stack>

        {!isComplete && (
          <Fade in timeout={200}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mb: 2,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'border.light',
                '& .MuiLinearProgress-bar': { borderRadius: 2 },
              }}
            />
          </Fade>
        )}

        <DimensionGrid results={results} loading={loading} onRescan={rescanOne} />
      </Box>
    </Fade>
  )
}

export default SecurityReport
