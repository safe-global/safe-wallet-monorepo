import { type ReactElement } from 'react'
import { Box, Typography, Stack, SvgIcon } from '@mui/material'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import type { ContractAnalysisResults, RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SEVERITY_COLORS } from '../constants'

export const SafeShieldHeader = ({
  recipient = [{}, undefined, false],
  contract = [{}, undefined, false],
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
}): ReactElement => {
  const [recipientResults = {}, recipientError, recipientLoading = false] = recipient
  const [contractResults = {}, contractError, contractLoading = false] = contract

  const status = getOverallStatus(recipientResults, contractResults)

  const loading = recipientLoading || contractLoading
  const error = recipientError || contractError

  const headerBgColor =
    !status || !status?.severity || loading
      ? 'var(--color-background-default)'
      : SEVERITY_COLORS[status.severity].background

  const headerTextColor =
    !status || !status?.severity || loading ? 'text.secondary' : SEVERITY_COLORS[status.severity].main

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
