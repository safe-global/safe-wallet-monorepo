import { type ReactElement, useEffect, useRef } from 'react'
import { Box, Fade, Skeleton, Stack } from '@mui/material'
import useSecurityScan from '@/features/security/hooks/useSecurityScan'
import type { ScanContext, ScanResult } from '@/features/security/data/scanners/types'
import SecurityStrengthBar from '@/features/security/components/SecurityStrengthBar'
import DimensionGrid from './DimensionGrid'

type SecurityReportProps = {
  scanContext: ScanContext | null
  onScanComplete?: (
    safeAddress: string,
    chainId: string,
    timestamp: number,
    results: Record<string, ScanResult>,
  ) => void
}

const SecurityReport = ({ scanContext, onScanComplete }: SecurityReportProps): ReactElement => {
  const { results, loading, isComplete, lastScannedAt, rescan } = useSecurityScan(scanContext)
  const scanContextRef = useRef(scanContext)
  scanContextRef.current = scanContext

  useEffect(() => {
    if (isComplete && lastScannedAt && onScanComplete && scanContextRef.current) {
      onScanComplete(scanContextRef.current.safeAddress, scanContextRef.current.chainId, lastScannedAt, results)
    }
    // Only fire when scan completes — not on every partial result update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, lastScannedAt])

  if (!scanContext) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '12px', mb: 3 }} />
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rectangular" width="33%" height={170} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" width="33%" height={170} sx={{ borderRadius: '12px' }} />
          <Skeleton variant="rectangular" width="33%" height={170} sx={{ borderRadius: '12px' }} />
        </Stack>
      </Box>
    )
  }

  return (
    <Fade in timeout={300}>
      <Box>
        <SecurityStrengthBar
          results={results}
          isComplete={isComplete}
          lastScannedAt={lastScannedAt}
          onRescan={rescan}
        />
        <DimensionGrid results={results} loading={loading} />
      </Box>
    </Fade>
  )
}

export default SecurityReport
