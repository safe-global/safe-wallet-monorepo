import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'

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
