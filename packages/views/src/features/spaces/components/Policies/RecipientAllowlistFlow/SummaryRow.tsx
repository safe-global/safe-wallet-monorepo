import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'

/** A `label | values` row with a 40px label box, so the label lines up with a name-over-address value. */
export const SummaryRow = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className="@container w-full">
    <div className="grid grid-cols-1 items-start gap-1 @md:grid-cols-[176px_1fr] @md:gap-6">
      <Typography variant="paragraph-small" className="flex min-h-10 items-center">
        {label}
      </Typography>
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </div>
  </div>
)

/** A value line at the row's 40px height, so one-line and two-line values centre on the same axis. */
export const SummaryLine = ({ children, className }: { children: ReactNode; className?: string }): ReactElement => (
  <div className={cn('flex min-h-10 items-center', className)}>{children}</div>
)
