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
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import { useCheckSimulation } from '../hooks/useCheckSimulation'

const shieldLogoOnHover = {
  width: 78,
  height: 18,
  '&:hover': {
    cursor: 'pointer',
    '& .shield-bg': {
      fill: 'var(--color-background-lightGrey)',
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
