import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import PolicyStatusChip, { type PolicyStatusChipProps } from '../../components/PolicyStatusChip'

export type PolicyStatusCellProps = {
  chip: PolicyStatusChipProps
  /** What the policy waits for, shown on hover. */
  detail?: string
}

const PolicyStatusCell = ({ chip, detail }: PolicyStatusCellProps): ReactElement => {
  if (!detail) return <PolicyStatusChip {...chip} />

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <PolicyStatusChip {...chip} />
      </TooltipTrigger>
      <TooltipContent className="bg-popover text-popover-foreground ring-foreground/10 shadow-md ring-1 [&>[data-side]]:hidden">
        <span data-testid="policy-status-detail">{detail}</span>
      </TooltipContent>
    </Tooltip>
  )
}

export default PolicyStatusCell
