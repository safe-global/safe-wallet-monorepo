import type { ReactElement, ReactNode } from 'react'
import { Stack, Typography } from '@mui/material'
import { AnalysisGroupCard, type AnalysisGroupCardProps } from '@/features/safe-shield/components/AnalysisGroupCard'
import HypernativeLogo from '../HypernativeLogo'

type HnAnalysisGroupCardProps = Omit<AnalysisGroupCardProps, 'footer'> & {
  overflowRow?: ReactNode
}

const ByHypernativeFooter = () => (
  <Stack direction="row" alignItems="center" alignSelf="flex-end" gap={0.5}>
    <Typography variant="caption" color="text.secondary">
      by
    </Typography>
    <HypernativeLogo
      sx={{
        width: 78,
        height: 15,
        '& > rect': { fill: (theme) => theme.palette.text.secondary },
      }}
    />
  </Stack>
)

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
