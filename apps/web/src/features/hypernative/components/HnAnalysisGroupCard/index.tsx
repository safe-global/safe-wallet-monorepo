import type { ReactElement, ReactNode } from 'react'
import { AnalysisGroupCard, type AnalysisGroupCardProps } from '@/features/safe-shield'
import { HnAnalysisGroupCardView } from '@views/features/hypernative/components/HnAnalysisGroupCard/HnAnalysisGroupCardView'

type HnAnalysisGroupCardProps = Omit<AnalysisGroupCardProps, 'footer'> & {
  overflowRow?: ReactNode
}

/**
 * Hypernative-branded variant of AnalysisGroupCard.
 * Strips requestId to hide the "Report false result" link (Blockaid-only).
 */
export const HnAnalysisGroupCard = ({
  requestId: _requestId,
  overflowRow,
  ...props
}: HnAnalysisGroupCardProps): ReactElement | null => {
  return (
    <HnAnalysisGroupCardView
      overflowRow={overflowRow}
      renderCard={(footer) => <AnalysisGroupCard {...props} footer={footer} />}
    />
  )
}
