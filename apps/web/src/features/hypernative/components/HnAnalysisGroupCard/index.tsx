import type { ReactElement } from 'react'
import { Stack, Typography } from '@mui/material'
import { AnalysisGroupCard, type AnalysisGroupCardProps } from '@/features/safe-shield/components/AnalysisGroupCard'
import HypernativeLogo from '../HypernativeLogo'

type HnAnalysisGroupCardProps = Omit<AnalysisGroupCardProps, 'footer'>

/**
 * Hypernative-branded variant of AnalysisGroupCard.
 * Renders the "by Hypernative" footer inside the collapse content.
 */
export const HnAnalysisGroupCard = (props: HnAnalysisGroupCardProps): ReactElement | null => {
  const footer = (
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

  return <AnalysisGroupCard {...props} footer={footer} />
}
