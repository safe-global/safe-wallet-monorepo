import { useContext, useMemo, type ReactElement } from 'react'
import { Box, Typography, Stack, SvgIcon } from '@mui/material'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SEVERITY_COLORS } from '../constants'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isSimulationError, isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { useNestedTransaction } from './useNestedTransaction'
import { useCurrentChain } from '@/hooks/useChains'

export const SafeShieldHeader = ({
  recipient = [{}, undefined, false],
  contract = [{}, undefined, false],
  threat = [{}, undefined, false],
  safeTx,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
}): ReactElement => {
  const chain = useCurrentChain()
  const [recipientResults, recipientError, recipientLoading = false] = recipient
  const [contractResults, contractError, contractLoading = false] = contract
  const [threatResults, threatError, threatLoading = false] = threat
  const { status: simulationStatus, nestedTx } = useContext(TxInfoContext)
  const { isNested } = useNestedTransaction(safeTx, chain)
  const showSimulation = isTxSimulationEnabled(chain) && safeTx

  const hasSimulationError = showSimulation && isSimulationError(simulationStatus, nestedTx, isNested)

  const status = useMemo(
    () => getOverallStatus(recipientResults, contractResults, threatResults, hasSimulationError),
    [recipientResults, contractResults, threatResults, hasSimulationError],
  )

  const loading = recipientLoading || contractLoading || threatLoading
  const error = recipientError || contractError || threatError

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
            Analyzing...
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
