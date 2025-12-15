import { type ReactElement } from 'react'
import { Box, Typography, Stack } from '@mui/material'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  Severity,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SEVERITY_COLORS } from '../constants'
import { useDelayedLoading } from '../hooks/useDelayedLoading'

const headerVisibilityDelay = 500

export const SafeShieldHeader = ({
  recipient = [{}, undefined, false],
  contract = [{}, undefined, false],
  threat = [{}, undefined, false],
  overallStatus,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  overallStatus?: { severity: Severity; title: string }
}): ReactElement => {
  const [_recipientResults, recipientError, recipientLoading = false] = recipient
  const [_contractResults, contractError, contractLoading = false] = contract
  const [_threatResults, threatError, threatLoading = false] = threat

  const loading = recipientLoading || contractLoading || threatLoading
  const error = recipientError || contractError || threatError
  const isLoadingVisible = useDelayedLoading(loading, headerVisibilityDelay)

  const headerBgColor =
    !overallStatus || !overallStatus?.severity || isLoadingVisible
      ? 'var(--color-background-default)'
      : SEVERITY_COLORS[overallStatus.severity].background

  const headerTextColor =
    !overallStatus || !overallStatus?.severity || isLoadingVisible
      ? 'text.secondary'
      : SEVERITY_COLORS[overallStatus.severity].main

  return (
    <Box padding="4px 4px 0px">
      <Stack
        direction="row"
        data-testid="safe-shield-status"
        sx={{ backgroundColor: headerBgColor }}
        borderRadius="6px 6px 0px 0px"
        px={2}
        py={1}
      >
        {error ? (
          <Typography variant="overline" color={headerTextColor} fontWeight={700} lineHeight="16px">
            Checks unavailable
          </Typography>
        ) : isLoadingVisible ? (
          <Typography variant="overline" color={headerTextColor} fontWeight={700} lineHeight="16px">
            Analyzing...
          </Typography>
        ) : overallStatus ? (
          <Typography variant="overline" color={headerTextColor} fontWeight={700} lineHeight="16px">
            {overallStatus.title}
          </Typography>
        ) : (
          <Typography variant="overline" color={headerTextColor} fontWeight={700} lineHeight="16px">
            Copilot
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
