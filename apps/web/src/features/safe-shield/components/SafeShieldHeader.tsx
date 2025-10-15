import { type ReactElement } from 'react'
import { Box, Typography, Stack, SvgIcon } from '@mui/material'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import type { AnalysisResult, LiveAnalysisResponse, Severity } from '@safe-global/utils/features/safe-shield/types'
import { getPrimaryResult } from '../utils'

const SEVERITY_TO_LABEL: Record<Severity, string> = {
  CRITICAL: 'Risk detected',
  WARN: 'Issues found',
  INFO: 'Review details',
  OK: 'Checks passed',
}

// Helper to determine overall status
const getOverallStatus = (analysisData?: LiveAnalysisResponse | null): { severity: Severity; title: string } | null => {
  if (!analysisData) {
    return null
  }

  // Flatten all AnalysisResult objects from contract, recipient, and threat into one array
  const allResults: AnalysisResult<any>[] = []

  // Add contract and recipient results
  for (const data of [analysisData.contract, analysisData.recipient]) {
    if (data) {
      for (const addressResults of Object.values(data)) {
        for (const groupResults of Object.values(addressResults)) {
          if (groupResults) {
            allResults.push(...groupResults)
          }
        }
      }
    }
  }

  // Add threat result
  if (analysisData.threat) {
    allResults.push(analysisData.threat)
  }

  const primaryResult = getPrimaryResult(allResults)

  if (!primaryResult) {
    return { severity: 'OK' as Severity, title: 'Checks passed' }
  }

  return { severity: primaryResult.severity, title: SEVERITY_TO_LABEL[primaryResult.severity] }
}

export const SafeShieldHeader = ({
  data,
  error,
  loading,
}: {
  data?: LiveAnalysisResponse | null
  error?: Error | null
  loading?: boolean
}): ReactElement => {
  const status = getOverallStatus(data)
  // Header background color based on severity
  const headerBgColor =
    !status || !status?.severity
      ? 'background.default'
      : {
          OK: 'success.background',
          INFO: 'info.background',
          WARN: 'warning.background',
          CRITICAL: 'error.background',
        }[status.severity]

  const headerTextColor =
    !status || !status?.severity
      ? 'text.secondary'
      : {
          OK: 'success.main',
          INFO: 'info.main',
          WARN: 'warning.main',
          CRITICAL: 'error.main',
        }[status.severity]

  return (
    <Box padding="4px 4px 0px">
      <Stack direction="row" sx={{ backgroundColor: headerBgColor }} borderRadius="6px 6px 0px 0px" px={2} py={1}>
        {error ? (
          <Typography variant="overline" color={headerTextColor} fontWeight={700} lineHeight="16px">
            Checks unavailable
          </Typography>
        ) : loading ? (
          <Typography variant="overline" color={headerTextColor} fontWeight={700} lineHeight="16px">
            Analyzing details
          </Typography>
        ) : status ? (
          <Typography variant="overline" color={headerTextColor} fontWeight={700} lineHeight="16px">
            {status.title}
          </Typography>
        ) : (
          <SvgIcon component={SafeShieldLogo} inheritViewBox sx={{ width: 14, height: 14 }} />
        )}
      </Stack>
    </Box>
  )
}
