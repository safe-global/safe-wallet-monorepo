import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import HypernativeLogo from '@views/features/hypernative/components/HypernativeLogo'

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

export type HnAnalysisGroupCardViewProps = {
  overflowRow?: ReactNode
  renderCard: (footer: ReactNode) => ReactNode
}

// Stacks an optional overflow row above the "by Hypernative" footer.
export const HnAnalysisGroupCardView = ({ overflowRow, renderCard }: HnAnalysisGroupCardViewProps): ReactElement => {
  const footer = (
    <>
      {overflowRow}
      <ByHypernativeFooter />
    </>
  )

  return <>{renderCard(footer)}</>
}
