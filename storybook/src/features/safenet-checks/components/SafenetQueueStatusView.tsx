import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SeverityIcon } from '@views/features/safe-shield/components/SeverityIcon'

export type SafenetQueueStatusViewProps = {
  status: string
  severity: Severity
  label: string
  copy: string
}

export const SafenetQueueStatusView = ({
  status,
  severity,
  label,
  copy,
}: SafenetQueueStatusViewProps): ReactElement => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div data-testid="safenet-queue-status" data-status={status} className="inline-flex items-center gap-1">
            <SeverityIcon severity={severity} />
            <Typography variant="paragraph-mini" className="text-muted-foreground">
              {label}
            </Typography>
          </div>
        }
      />
      <TooltipContent side="top">{copy}</TooltipContent>
    </Tooltip>
  )
}
