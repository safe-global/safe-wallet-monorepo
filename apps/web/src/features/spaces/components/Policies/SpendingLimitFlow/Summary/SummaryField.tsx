import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

type SummaryFieldProps = {
  label: string
  children: ReactNode
}

/** A `label | content` row (Figma: 88 px). Below `@md` the label stacks, or it starves the Safe row's identity column. */
const SummaryField = ({ label, children }: SummaryFieldProps): ReactElement => (
  <div className="@container">
    <div className="grid grid-cols-1 items-start gap-1 @md:grid-cols-[88px_1fr] @md:gap-3">
      <Typography variant="paragraph-small-medium" className="pt-0.5">
        {label}
      </Typography>
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </div>
  </div>
)

export default SummaryField
