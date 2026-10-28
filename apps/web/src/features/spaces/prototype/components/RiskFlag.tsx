import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import type { Proposal } from '../types'

// Production's transaction warning chips (components/transactions/Warning): same names and tooltips. Untrusted is yellow here, red in production.
export type RiskFlag = {
  key: string
  label: string
  variant: 'destructive' | 'warning' | 'success'
  hint: string
  // Counts as a Security issue and opens Security.
  issue: boolean
}

const DELEGATE_HINT = 'This transaction calls a smart contract that will be able to modify your Safe account.'

export const isUntrusted = (tx: Proposal) => !!tx.proposedBy && tx.signers.length === 0

export const getRiskFlags = (tx: Proposal): RiskFlag[] => {
  const { kind } = tx
  const flags: RiskFlag[] = []
  if (isUntrusted(tx))
    flags.push({
      key: 'untrusted',
      label: 'Untrusted transaction',
      variant: 'warning',
      hint: 'This transaction is unsigned and could have been created by anyone. To avoid phishing, only sign it if you trust the source of the link.',
      issue: true,
    })
  if (kind.type === 'batch' && kind.delegateCall)
    flags.push(
      kind.delegateCall === 'untrusted'
        ? { key: 'delegate', label: 'Unexpected delegate call', variant: 'warning', hint: DELEGATE_HINT, issue: true }
        : { key: 'delegate', label: 'Delegate call', variant: 'success', hint: DELEGATE_HINT, issue: false },
    )
  if (kind.type === 'settings' && ['addOwner', 'removeOwner', 'changeThreshold'].includes(kind.change.kind))
    flags.push({
      key: 'policy',
      label: 'Confirmation policy change',
      variant: 'warning',
      hint: 'This transaction potentially alters the number of confirmations required to execute a transaction. Please verify before signing.',
      issue: true,
    })
  return flags
}

export function RiskFlagBadge({ flag }: { flag: RiskFlag }) {
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="flex" />} onClick={(event) => event.stopPropagation()}>
        <Badge variant={flag.variant}>{flag.label}</Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal">{flag.hint}</TooltipContent>
    </Tooltip>
  )
}
