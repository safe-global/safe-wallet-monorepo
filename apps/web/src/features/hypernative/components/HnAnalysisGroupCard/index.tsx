import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { AnalysisGroupCard, type AnalysisGroupCardProps } from '@/features/safe-shield/components/AnalysisGroupCard'
import HypernativeLogo from '../HypernativeLogo'

type HnAnalysisGroupCardProps = Omit<AnalysisGroupCardProps, 'footer'> & {
  overflowRow?: ReactNode
}

const ByHypernativeFooter = () => {
  return (
    <div className="flex flex-row items-center gap-1 self-end">
      <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)]">
        by
      </Typography>
      <HypernativeLogo fill="var(--color-text-secondary)" className="h-[17px] w-[70px]" />
    </div>
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
