import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ReactElement } from 'react'
import WarningIcon from '@/public/images/notifications/warning.svg'

/**
 * Warning chip displayed on addresses that have been flagged for similarity
 * to other addresses in the list (potential address poisoning attack)
 */
export function SimilarityWarning(): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="ml-2 inline-flex shrink-0">
            <WarningIcon className="size-5 text-[var(--color-error-main)]" data-testid="similarity-warning" />
          </span>
        }
      />
      <TooltipContent>This address looks similar to another address. Double-check before selecting.</TooltipContent>
    </Tooltip>
  )
}
