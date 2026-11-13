import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { CopyableParty } from '../CopyableParty'
import {
  getCounterpartyCell,
  getCounterpartyJoin,
  getSummary,
  getSummaryHint,
  isNewRecipient,
} from '../../services/columns'
import { getAccount, getTypeLabel, shortAddress } from '../../services/model'
import type { Proposal } from '../../types'
import { Tag } from '@safe-global/views/components/ui/tag'
import { AppTag, HINT_CLASS, ROW_TAG_FILL, TypeTag } from '../shared'

// A name only when the address book has one. Otherwise the short address.
const hasName = (name: string) => !!name && name !== 'Unknown' && !name.startsWith('0x')
const short = (address: string) => (address.includes('…') ? address : shortAddress(address))

// What happens. The tooltip repeats it in full, with the dollar value or what the action does.
export function SummaryText({ tx }: { tx: Proposal }) {
  const hint = getSummaryHint(tx)
  const summary = getSummary(tx)
  // Long method and contract names truncate, so the tooltip always has the full text.
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="min-w-0 truncate tabular-nums" />}>{summary}</TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <span className="block break-words font-medium">{summary}</span>
        {hint && <span className="mt-1 block">{hint}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

// Type tag and what happens. With the other party inline it keeps its width, and the other party truncates instead.
export function TransactionHead({
  tx,
  onRow = false,
  keepWidth = false,
  aligned = false,
}: {
  tx: Proposal
  onRow?: boolean
  keepWidth?: boolean
  // Fixed-width type tag, so summaries start at the same place on every row.
  aligned?: boolean
}) {
  const tag = tx.app ? (
    <AppTag app={tx.app} onRow={onRow} truncate={aligned} />
  ) : (
    <TypeTag type={getTypeLabel(tx)} onRow={onRow} truncate={aligned} />
  )
  return (
    <span className={`flex min-w-0 items-center gap-2 ${keepWidth ? 'shrink-0' : ''} ${aligned ? 'flex-1' : ''}`}>
      {aligned ? <span className="flex w-26 min-w-0 shrink-0">{tag}</span> : tag}
      <SummaryText tx={tx} />
    </span>
  )
}

// Settings, rejections and transfers to the Safe itself have no other party.
export const hasCounterparty = (tx: Proposal) =>
  tx.kind.type !== 'settings' && tx.kind.type !== 'rejection' && getCounterpartyCell(tx).name !== 'This Safe'

// The other party. Its tooltip copies the address. In its own column, "to" or "via" becomes a tag like the type.
export function Counterparty({
  tx,
  inColumn = false,
  tag = false,
}: {
  tx: Proposal
  inColumn?: boolean
  tag?: boolean
}) {
  const counterparty = getCounterpartyCell(tx)
  if (!hasCounterparty(tx)) return null
  const address = counterparty.address ?? counterparty.avatar
  // A recipient missing from the address book shows its address, even when the proposer named it.
  const named = hasName(counterparty.name) && !isNewRecipient(tx)
  // Inline, the other party stops at 14rem so the action stays readable. Its tooltip has the full name.
  return (
    <span className={`flex min-w-0 items-center gap-2 ${inColumn ? '' : 'max-w-56'}`}>
      {inColumn && !tag ? (
        // Fixed width, so names line up whether the tag says To or Via.
        <span className={`flex w-10 shrink-0 ${ROW_TAG_FILL}`}>
          <Tag className="w-full justify-center">
            {getCounterpartyJoin(tx).replace(/^./, (letter) => letter.toUpperCase())}
          </Tag>
        </span>
      ) : (
        // A plain word in the sentence. Fixed width in the column, so names line up.
        <span className={`shrink-0 text-sm text-muted-foreground ${inColumn ? 'w-7' : ''}`}>
          {getCounterpartyJoin(tx)}
        </span>
      )}
      <CopyableParty
        name={named ? counterparty.name : short(address)}
        address={address}
        avatar={counterparty.avatar}
        mono={!named}
        logo={counterparty.logo}
        contract={counterparty.contract}
        tag={tag}
        chainId={getAccount(tx).chainId}
      />
    </span>
  )
}
