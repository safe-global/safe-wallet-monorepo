import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { SPENDING_LIMIT_TOKEN_HINT } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

/** Marks a token that a spending limit of the Safe uses, which the allowlist blocks unless the token is added. */
const SpendingLimitTokenMark = (): ReactElement => (
  // A click on the mark explains it, and leaves the option or chip it sits in as it is
  <span className="flex shrink-0" onClick={(event) => event.stopPropagation()} data-testid="spending-limit-token-mark">
    <Tooltip>
      <TooltipTrigger
        render={<Info className="size-3.5 cursor-help text-muted-foreground" aria-label={SPENDING_LIMIT_TOKEN_HINT} />}
      />
      <TooltipContent>{SPENDING_LIMIT_TOKEN_HINT}</TooltipContent>
    </Tooltip>
  </span>
)

export default SpendingLimitTokenMark
