import { type ReactElement } from 'react'
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

const shieldLogoOnHover = {
  width: 78,
  height: 18,
  '&:hover': {
    cursor: 'pointer',
    // bg:
    rect: {
      fill: 'var(--color-background-lightGrey)',
    },
    // Shield image:
    '& g:first-of-type > path:first-of-type': {
      fill: 'var(--color-text-brand)',
      transition: 'fill 0.2s ease',
    },
    // Lines on shield:
    '& g:first-of-type > g[filter] > path': {
      fill: '#121312', // consistent between dark/light modes
      transition: 'fill 0.2s ease',
    },
    // "Safe Shield" text:
    '& > path': {
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
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
}): ReactElement => {
  const isDarkMode = useDarkMode()
  return (
    <Stack gap={1} data-testid="safe-shield-widget">
      <Card sx={{ borderRadius: '6px', overflow: 'hidden' }}>
        <SafeShieldHeader recipient={recipient} contract={contract} threat={threat} safeTx={safeTx} />

        <SafeShieldContent threat={threat} recipient={recipient} contract={contract} safeTx={safeTx} />
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
