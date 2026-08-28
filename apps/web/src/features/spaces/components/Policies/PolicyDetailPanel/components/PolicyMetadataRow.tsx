import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

/** One labelled row in the panel, such as Created by or Enforced by. */
const PolicyMetadataRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3" data-testid={`policy-meta-${label}`}>
    <Typography variant="paragraph-small" className="shrink-0 text-muted-foreground">
      {label}
    </Typography>
    <div className="flex min-w-0 justify-end text-right">{children}</div>
  </div>
)

export default PolicyMetadataRow
