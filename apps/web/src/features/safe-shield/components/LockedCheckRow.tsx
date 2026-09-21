import type { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'

/** A Pro-only check the user does not get: named, locked, with an optional word on how to unlock it. */
export const LockedCheckRow = ({
  children,
  tooltip,
  'data-testid': testId,
}: PropsWithChildren<{ tooltip?: ReactNode; 'data-testid'?: string }>): ReactElement => (
  <div className="flex h-11 flex-row items-center gap-2 pl-3" data-testid={testId}>
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
  </div>
)
