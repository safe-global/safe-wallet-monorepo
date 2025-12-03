import { useMemo, type ReactElement } from 'react'
import { Card, SvgIcon, Stack } from '@mui/material'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import { useCheckSimulation } from '../hooks/useCheckSimulation'

export const SafeShieldDisplay = ({
  recipient,
  contract,
  threat,
  safeTx,
  hnLoginRequired = false,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
  hnLoginRequired?: boolean
}): ReactElement => {
  const [recipientResults] = recipient || []
  const [contractResults] = contract || []
  const [threatResults] = threat || []
  const { hasSimulationError } = useCheckSimulation(safeTx)
  const isDarkMode = useDarkMode()

  const overallStatus = useMemo(
    () => getOverallStatus(recipientResults, contractResults, threatResults, hasSimulationError, hnLoginRequired),
    [recipientResults, contractResults, threatResults, hasSimulationError, hnLoginRequired],
  )

  return (
    <Stack gap={1} data-testid="safe-shield-widget">
      <Card sx={{ borderRadius: '6px', overflow: 'hidden' }}>
        <SafeShieldHeader recipient={recipient} contract={contract} threat={threat} overallStatus={overallStatus} />

        <SafeShieldContent
          threat={threat}
          recipient={recipient}
          contract={contract}
          safeTx={safeTx}
          overallStatus={overallStatus}
        />
      </Card>

      <Stack direction="row" alignItems="center" alignSelf="flex-end">
        <SvgIcon
          component={isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull}
          inheritViewBox
          sx={{ width: 78, height: 18 }}
        />
      </Stack>
    </Stack>
  )
}
