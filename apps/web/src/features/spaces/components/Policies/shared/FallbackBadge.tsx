import type { ReactElement } from 'react'
import { Chip } from '@safe-global/views/components/ui/chip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

/**
 * Marks a policy bound to the guard's catch-all access. It applies to any transaction
 * no other policy matches, so it's worth calling out next to the specific rules.
 */
export const FallbackBadge = ({ size = 'sm' }: { size?: 'sm' | 'default' }): ReactElement => (
  <Tooltip>
    <TooltipTrigger render={<span className="cursor-default" />}>
      <Chip variant="outline" size={size} className="font-bold tracking-wide">
        Fallback
      </Chip>
    </TooltipTrigger>
    <TooltipContent>Applies to any transaction that no other policy covers</TooltipContent>
  </Tooltip>
)

export default FallbackBadge
