import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { CopyableParty } from '../CopyableParty'
import { getCounterpartyCell, getCounterpartyJoin, getSummary, getSummaryHint } from '../../services/columns'
import { getTypeLabel, shortAddress } from '../../services/model'
import type { Proposal } from '../../types'
import { HINT_CLASS, TypeTag } from '../shared'

// A name only when the address book has one. Otherwise the short address.
const hasName = (name: string) => !!name && name !== 'Unknown' && !name.startsWith('0x')
const short = (address: string) => (address.includes('…') ? address : shortAddress(address))

// What happens. The tooltip gives the dollar value or explains the action.
export function SummaryText({ tx }: { tx: Proposal }) {
  const hint = getSummaryHint(tx)
  const summary = getSummary(tx)
  if (!hint) return <span className="min-w-0 truncate tabular-nums">{summary}</span>
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="min-w-0 truncate tabular-nums" />}>{summary}</TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>{hint}</TooltipContent>
    </Tooltip>
  )
}

// Type tag and what happens.
export function TransactionHead({ tx, onRow = false }: { tx: Proposal; onRow?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TypeTag type={getTypeLabel(tx)} onRow={onRow} />
      <SummaryText tx={tx} />
    </span>
  )
}

// The other party. Its tooltip copies the address.
export function Counterparty({ tx }: { tx: Proposal }) {
  const counterparty = getCounterpartyCell(tx)
  if (tx.kind.type === 'settings' || tx.kind.type === 'rejection' || counterparty.name === 'This Safe') return null
  const address = counterparty.address ?? counterparty.avatar
  const named = hasName(counterparty.name)
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-sm text-muted-foreground">{getCounterpartyJoin(tx)}</span>
      <CopyableParty
        name={named ? counterparty.name : short(address)}
        address={address}
        avatar={counterparty.avatar}
        mono={!named}
      />
    </span>
  )
}
