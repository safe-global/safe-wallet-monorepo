import type { ReactElement, ReactNode } from 'react'
import { Stack, Typography, useTheme } from '@mui/material'
import { AnalysisGroupCard, type AnalysisGroupCardProps } from '@/features/safe-shield'
import HypernativeLogo from '../HypernativeLogo'

type HnAnalysisGroupCardProps = Omit<AnalysisGroupCardProps, 'footer'> & {
  overflowRow?: ReactNode
}

const ByHypernativeFooter = () => {
  const theme = useTheme()
  return (
    <Stack direction="row" alignItems="center" alignSelf="flex-end" gap={0.5}>
      <Typography variant="caption" color="text.secondary">
        by
      </Typography>
      <HypernativeLogo fill={theme.palette.text.secondary} sx={{ width: 70, height: 17 }} />
    </Stack>
  )
}

/**
 * Hypernative-branded variant of AnalysisGroupCard.
 * Stacks an optional overflow row above the "by Hypernative" footer.
 * Strips requestId to hide the "Report false result" link (Blockaid-only).
 */
export const HnAnalysisGroupCard = ({
  requestId: _requestId, // eslint-disable-line unused-imports/no-unused-vars
  overflowRow,
  ...props
}: HnAnalysisGroupCardProps): ReactElement | null => {
  const footer = (
    <>
      {overflowRow}
      <ByHypernativeFooter />
    </>
  )

  return <AnalysisGroupCard {...props} footer={footer} />
}
