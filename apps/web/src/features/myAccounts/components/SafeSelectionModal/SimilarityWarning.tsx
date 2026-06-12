import { Chip } from '@/components/ui/chip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TriangleAlertIcon } from 'lucide-react'

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
          <Chip
            variant="outline"
            data-testid="similarity-warning"
            className="cursor-help border-[var(--color-warning-main)] text-[var(--color-warning-main)]"
          />
        }
      >
        <TriangleAlertIcon className="size-4" />
        High similarity
      </TooltipTrigger>
      <TooltipContent>{TOOLTIP_TEXT}</TooltipContent>
    </Tooltip>
  )
}

export default SimilarityWarning
