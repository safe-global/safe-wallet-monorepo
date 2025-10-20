import { type ReactElement } from 'react'
import { Typography, Card, SvgIcon, Stack } from '@mui/material'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  LiveThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export const SafeShieldDisplay = ({
  recipient,
  contract,
  threat,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<LiveThreatAnalysisResult>
}): ReactElement => {
  return (
    <Stack gap={1}>
      <Card sx={{ borderRadius: '6px', overflow: 'hidden' }}>
        <SafeShieldHeader recipient={recipient} contract={contract} />

        <SafeShieldContent threat={threat} recipient={recipient} contract={contract} />
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
