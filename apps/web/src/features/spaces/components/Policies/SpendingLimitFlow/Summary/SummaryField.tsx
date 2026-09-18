import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

type SummaryFieldProps = {
  label: string
  children: ReactNode
}

/** A `label | content` row. The fixed label column keeps every card's content aligned (Figma: 88 px). */
const SummaryField = ({ label, children }: SummaryFieldProps): ReactElement => (
  <div className="grid grid-cols-[88px_1fr] items-start gap-3">
    <Typography variant="paragraph-small-medium" className="pt-0.5">
      {label}
    </Typography>
    <div className="flex min-w-0 flex-col gap-2">{children}</div>
  </div>
)

export default SummaryField
