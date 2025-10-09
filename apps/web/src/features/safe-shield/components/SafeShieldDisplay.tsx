import { type ReactElement } from 'react'
import { Typography, Card, SvgIcon, Stack } from '@mui/material'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import type { LiveAnalysisResponse } from '../types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'

export const SafeShieldDisplay = ({
  data,
  error,
  loading,
}: {
  data?: LiveAnalysisResponse | null
  error?: Error | null
  loading?: boolean
}): ReactElement => {
  return (
    <Stack gap={1}>
      <Card sx={{ borderRadius: '6px', overflow: 'hidden' }}>
        <SafeShieldHeader data={data} error={error} loading={loading} />

        <SafeShieldContent analysisData={data} error={error} loading={loading} />
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
