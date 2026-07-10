import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const TOOLTIP_TEXT =
  'This address looks similar to another address in your list. Attackers create lookalike addresses to trick you. Verify the full address before selecting.'

/**
 * Warning chip for addresses that are similar to others in the list
 * Shows a neutral "Similar address" label - we don't assess risk level
 * since any similarity could be an attack
 */
const SimilarityWarning = () => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant="warning" data-testid="similarity-warning" className="cursor-help">
            <TriangleAlert className="size-4" />
            High similarity
          </Badge>
        }
      />
      <TooltipContent className="max-w-xs">{TOOLTIP_TEXT}</TooltipContent>
    </Tooltip>
  )
}

export default SimilarityWarning
