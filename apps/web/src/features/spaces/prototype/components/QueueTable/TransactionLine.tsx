import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { CopyableParty } from '../CopyableParty'
import {
  getCounterpartyCell,
  getCounterpartyJoin,
  getSummary,
  getSummaryHint,
  isNewRecipient,
} from '../../services/columns'
import { getTypeLabel, shortAddress } from '../../services/model'
import type { Proposal } from '../../types'
import { Tag } from '@safe-global/views/components/ui/tag'
import { AppTag, HINT_CLASS, ROW_TAG_FILL, TypeTag } from '../shared'

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

// Type tag and what happens. With the other party inline it keeps its width, and the other party truncates instead.
export function TransactionHead({
  tx,
  onRow = false,
  keepWidth = false,
}: {
  tx: Proposal
  onRow?: boolean
  keepWidth?: boolean
}) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${keepWidth ? 'shrink-0' : ''}`}>
      {tx.app ? <AppTag app={tx.app} onRow={onRow} /> : <TypeTag type={getTypeLabel(tx)} onRow={onRow} />}
      <SummaryText tx={tx} />
    </span>
  )
}

// Settings, rejections and transfers to the Safe itself have no other party.
export const hasCounterparty = (tx: Proposal) =>
  tx.kind.type !== 'settings' && tx.kind.type !== 'rejection' && getCounterpartyCell(tx).name !== 'This Safe'

// The other party. Its tooltip copies the address. In its own column, "to" or "via" becomes a tag like the type.
export function Counterparty({ tx, inColumn = false }: { tx: Proposal; inColumn?: boolean }) {
  const counterparty = getCounterpartyCell(tx)
  if (!hasCounterparty(tx)) return null
  const address = counterparty.address ?? counterparty.avatar
  // A recipient missing from the address book shows its address, even when the proposer named it.
  const named = hasName(counterparty.name) && !isNewRecipient(tx)
  // Inline, the other party stops at 14rem so the action stays readable. Its tooltip has the full name.
  return (
    <span className={`flex min-w-0 items-center gap-2 ${inColumn ? '' : 'max-w-56'}`}>
      {inColumn ? (
        // Fixed width, so names line up whether the tag says To or Via.
        <span className={`flex w-10 shrink-0 ${ROW_TAG_FILL}`}>
          <Tag className="w-full justify-center">
            {getCounterpartyJoin(tx).replace(/^./, (letter) => letter.toUpperCase())}
          </Tag>
        </span>
      ) : (
        <span className="shrink-0 text-sm text-muted-foreground">{getCounterpartyJoin(tx)}</span>
      )}
      <CopyableParty
        name={named ? counterparty.name : short(address)}
        address={address}
        avatar={counterparty.avatar}
        mono={!named}
        logo={counterparty.logo}
        contract={counterparty.contract}
      />
    </span>
  )
}
