import { Badge } from '@safe-global/design/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/design/components/ui/tooltip'
import InfoIcon from '@safe-global/design/assets/images/notifications/info.svg'

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
