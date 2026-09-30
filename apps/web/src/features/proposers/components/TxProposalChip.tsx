import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InfoIcon from '@/public/images/notifications/info.svg'

const TxProposalChip = () => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span tabIndex={0}>
            <Badge variant="subtle">
              <InfoIcon className="size-3" />
              <span data-testid="proposal-status">Proposal</span>
            </Badge>
          </span>
        }
      />
      <TooltipContent>This transaction was created by a Proposer. Reject or confirm it to proceed.</TooltipContent>
    </Tooltip>
  )
}

export default TxProposalChip
