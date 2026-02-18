import { useMemo, type ReactElement } from 'react'
import { Card, SvgIcon, Stack } from '@mui/material'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
  SafeAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import { useCheckSimulation } from '../hooks/useCheckSimulation'
import type { HypernativeAuthStatus } from '@/features/hypernative'

const shieldLogoOnHover = {
  width: 78,
  height: 18,
  '&:hover': {
    cursor: 'pointer',
    '& .shield-bg': {
      fill: 'var(--color-background-secondary)',
    },
    '& .shield-img': {
      fill: 'var(--color-static-text-brand)',
      transition: 'fill 0.2s ease',
    },
    '& .shield-lines': {
      fill: '#121312', // consistent between dark/light modes
      transition: 'fill 0.2s ease',
    },
    '& .shield-text': {
      fill: 'var(--color-text-primary)',
      transition: 'fill 0.2s ease',
    },
  },
} as const

export const SafeShieldDisplay = ({
  recipient,
  contract,
  threat,
  safeTx,
  hypernativeAuth,
  showHypernativeInfo = true,
  showHypernativeActiveStatus = true,
  safeAnalysis,
  onAddToTrustedList,
}: {
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
  hypernativeAuth?: HypernativeAuthStatus
  showHypernativeInfo?: boolean
  showHypernativeActiveStatus?: boolean
  safeAnalysis?: SafeAnalysisResult | null
  onAddToTrustedList?: () => void
}): ReactElement => {
  const [recipientResults] = recipient || []
  const [contractResults] = contract || []
  const [threatResults] = threat || []
  const { hasSimulationError } = useCheckSimulation(safeTx)
  const isDarkMode = useDarkMode()

  const hnLoginRequired = useMemo(
    () => hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired),
    [hypernativeAuth],
  )

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
          hypernativeAuth={hypernativeAuth}
          showHypernativeInfo={showHypernativeInfo}
          showHypernativeActiveStatus={showHypernativeActiveStatus}
          safeAnalysis={safeAnalysis}
          onAddToTrustedList={onAddToTrustedList}
        />
      </Card>

      <Stack direction="row" alignItems="center" alignSelf="flex-end">
        <ExternalLink href={HelpCenterArticle.SAFE_SHIELD} noIcon>
          <SvgIcon
            component={isDarkMode ? SafeShieldLogoFullDark : SafeShieldLogoFull}
            inheritViewBox
            sx={shieldLogoOnHover}
          />
        </ExternalLink>
      </Stack>
    </Stack>
  )
}
