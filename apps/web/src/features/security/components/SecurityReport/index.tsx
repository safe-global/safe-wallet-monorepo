import { type ReactElement, useEffect, useMemo, useRef } from 'react'
import { Box, Fade, Skeleton, Stack } from '@mui/material'
import useSecurityScan from '@/features/security/hooks/useSecurityScan'
import type { ScanContext, ScanResult } from '@/features/security/data/scanners/types'
import SecurityStrengthBar from '@/features/security/components/SecurityStrengthBar'
import type { CheckDef } from '@/features/security/data/securityChecks'
import CheckGrid, { type CardOverride } from './CheckGrid'

type SecurityReportProps = {
  scanContext: ScanContext | null
  buildCardOverrides?: (results: Record<string, ScanResult>) => Record<string, CardOverride>
  checkFilter?: (def: CheckDef) => boolean
  singleColumn?: boolean
  onScanComplete?: (
    safeAddress: string,
    chainId: string,
    timestamp: number,
    results: Record<string, ScanResult>,
  ) => void
}

const SecurityReport = ({
  scanContext,
  buildCardOverrides,
  checkFilter,
  singleColumn,
  onScanComplete,
}: SecurityReportProps): ReactElement => {
  const { results, loading, errors, isComplete, lastScannedAt, rescan } = useSecurityScan(scanContext)
  const scanContextRef = useRef(scanContext)
  scanContextRef.current = scanContext

  const cardOverrides = useMemo(() => buildCardOverrides?.(results) ?? {}, [buildCardOverrides, results])

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
        <CheckGrid
          results={results}
          loading={loading}
          errors={errors}
          cardOverrides={cardOverrides}
          checkFilter={checkFilter}
          singleColumn={singleColumn}
        />
      </Box>
    </Fade>
  )
}

export default SecurityReport
