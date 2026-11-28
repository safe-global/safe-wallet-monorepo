import type { ReactElement } from 'react'

import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'

export const ReportsUnavailable = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction: () => void
}): ReactElement => (
  <div className="flex flex-col items-center gap-2 rounded-xl bg-card p-10 text-center">
    <Typography variant="paragraph-bold">{title}</Typography>
    <Typography variant="paragraph-small" color="muted">
      {description}
    </Typography>
    {actionLabel && (
      <div className="pt-3">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    )}
  </div>
)
