import type { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'

export const LockedCheckRow = ({
  children,
  tooltip,
  action,
  'data-testid': testId,
}: PropsWithChildren<{
  tooltip?: ReactNode
  /** A way to unlock the check by hand, sitting where the open rows keep their button. */
  action?: ReactNode
  'data-testid'?: string
}>): ReactElement => (
  <div className="flex h-11 flex-row items-center gap-2 pr-3 pl-3" data-testid={testId}>
    <LockKeyhole className="size-4 text-[var(--color-primary-light)]" />
    <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
      {children}
    </Typography>
    {tooltip && (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <InfoIcon className="size-4 text-[var(--color-border-main)]" />
        </TooltipTrigger>
        <TooltipContent className="text-center">{tooltip}</TooltipContent>
      </Tooltip>
    )}
    {action && <span className="ml-auto flex items-center">{action}</span>}
  </div>
)
