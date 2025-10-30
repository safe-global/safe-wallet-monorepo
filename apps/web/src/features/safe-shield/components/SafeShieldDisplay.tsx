import { type ReactElement } from 'react'
import { Typography, Card, SvgIcon, Stack } from '@mui/material'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'

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
  return (
    <Stack gap={1}>
      <Card sx={{ borderRadius: '6px', overflow: 'hidden' }}>
        <SafeShieldHeader recipient={recipient} contract={contract} threat={threat} safeTx={safeTx} />

        <SafeShieldContent threat={threat} recipient={recipient} contract={contract} safeTx={safeTx} />
      </Card>

      <Stack direction="row" alignItems="center" alignSelf="flex-end">
        <Typography variant="body2" color="text.secondary" fontSize={13} lineHeight={1.38} whiteSpace="nowrap">
          Secured by
        </Typography>

        <SvgIcon component={SafeShieldLogoFull} inheritViewBox sx={{ width: 100.83, height: 14.87 }} />
      </Stack>
    </Stack>
  )
}
