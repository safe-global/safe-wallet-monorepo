import { ChevronRight } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS } from '@/services/analytics/events/nested-safes'
import WarningIcon from '@/public/images/notifications/warning.svg'

export function NestedSafeWarningIconView(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="ml-2 inline-flex shrink-0">
            <WarningIcon className="size-5 text-[var(--color-warning-main)]" data-testid="suspicious-safe-warning" />
          </span>
        }
      />
      <TooltipContent>This Safe was not created by the parent Safe or its signers</TooltipContent>
    </Tooltip>
  )
}

export type NestedSafesListViewProps = {
  children: ReactNode
  showShowAll?: boolean
  onShowAll?: () => void
}

export function NestedSafesListView({ children, showShowAll, onShowAll }: NestedSafesListViewProps): ReactElement {
  return (
    <ul className="m-0 flex list-none flex-col items-stretch gap-1 p-0">
      {children}
      {showShowAll && (
        <Track {...NESTED_SAFE_EVENTS.SHOW_ALL}>
          <Typography
            variant="paragraph-mini-bold"
            color="muted"
            className="flex cursor-pointer items-center justify-center py-2 uppercase"
            onClick={onShowAll}
          >
            Show all nested Safes
            <ChevronRight className="ml-2 size-3 rotate-90 text-[var(--color-border-main)]" />
          </Typography>
        </Track>
      )}
    </ul>
  )
}
