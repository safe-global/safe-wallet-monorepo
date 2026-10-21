import { useState, type ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { getCounterpartyCell, isNewRecipient } from '../../../services/columns'
import { getAccount, getToken } from '../../../services/model'
import { getFullAddress } from '../../../services/technical'
import type { Proposal } from '../../../types'
import { chainLogoUrl } from '../../shared'
import { AddressActions, IdentityRow } from './IdentityRow'

// The production "from → to" summary, as Summary rows.

function Endpoint({
  image,
  fallback,
  name,
  detail,
  tone,
}: {
  image?: string
  fallback: string
  name: string
  detail?: string
  tone?: 'warning'
}) {
  return (
    <span className="flex min-w-0 items-center justify-end gap-2">
      <Avatar size="xs" className="size-5">
        {image && <AvatarImage src={image} alt="" />}
        <AvatarFallback data-surface="card" className="text-[10px]">
          {fallback}
        </AvatarFallback>
      </Avatar>
      <span className={`min-w-0 truncate text-sm ${tone === 'warning' ? 'text-warning-strong' : ''}`}>{name}</span>
      {detail && <span className="shrink-0 text-xs text-muted-foreground">{detail}</span>}
    </span>
  )
}

export type FlowRow = {
  label: string
  content: ReactNode
  // To: several lines, so the label aligns with the first one.
  top?: boolean
}

// The recipient's whole address: checking it is the last defence against address poisoning.
function Recipient({ tx }: { tx: Proposal }) {
  const [added, setAdded] = useState(false)
  const { chainId } = getAccount(tx)
  const counterparty = getCounterpartyCell(tx)
  const full = counterparty.address ? getFullAddress(counterparty.address) : undefined
  const isNew = isNewRecipient(tx)
  return (
    <TwoLines>
      <span className="flex h-6 min-w-0 items-center gap-2">
        <IdentityRow
          inline
          align="start"
          name={counterparty.name}
          avatar={counterparty.avatar}
          detail=""
          tone={counterparty.tone}
          chainId={chainId}
        />
        {isNew && !added && <Badge variant="warning">New recipient</Badge>}
        {full && <AddressActions address={full} chainId={chainId} />}
      </span>
      {full && <span className="break-all font-mono text-xs text-muted-foreground">{full}</span>}
      {isNew &&
        (added ? (
          <span className="text-xs text-success-strong">Added to address book</span>
        ) : (
          <Button size="xs" variant="outline" onClick={() => setAdded(true)}>
            Add to address book
          </Button>
        ))}
    </TwoLines>
  )
}

// Right-aligned in the row, with its lines sharing one left edge.
const TwoLines = ({ children }: { children: ReactNode }) => (
  <span className="flex min-w-0 justify-end">
    <span className="flex min-w-0 flex-col items-start gap-1">{children}</span>
  </span>
)

// Your own Safe, laid out like the recipient: name, chain and address actions, then the full address.
function SafeIdentity({ tx }: { tx: Proposal }) {
  const account = getAccount(tx)
  return (
    <TwoLines>
      <span className="flex h-6 min-w-0 items-center gap-2">
        <IdentityRow inline align="start" name={account.name} avatar={account.iconAddress} detail="" />
        <Tooltip delay={150}>
          <TooltipTrigger render={<span className="flex shrink-0" />} aria-label={account.network}>
            <img src={chainLogoUrl(account.chainId)} alt="" className="size-4 rounded-full" />
          </TooltipTrigger>
          <TooltipContent>{account.network}</TooltipContent>
        </Tooltip>
        <AddressActions address={account.iconAddress} chainId={account.chainId} />
      </span>
      <span className="break-all font-mono text-xs text-muted-foreground">{account.iconAddress}</span>
    </TwoLines>
  )
}

export function getFlowRows(tx: Proposal): FlowRow[] {
  const account = getAccount(tx)
  const { kind } = tx
  const safe = <SafeIdentity tx={tx} />
  const counterparty = getCounterpartyCell(tx)
  const toSelf = kind.type === 'transfer' && kind.toSelf
  const to: FlowRow = toSelf
    ? {
        label: 'To',
        content: (
          <IdentityRow
            inline
            name={counterparty.name}
            address={counterparty.address}
            avatar={counterparty.avatar}
            chainId={account.chainId}
          />
        ),
      }
    : { label: 'To', top: true, content: <Recipient tx={tx} /> }
  switch (kind.type) {
    case 'swap':
      return [
        { label: 'Sell', content: <Endpoint fallback={getToken(kind.sell)[0]} name={kind.sell} /> },
        { label: 'Buy', content: <Endpoint fallback={getToken(kind.buy)[0]} name={kind.buy} detail="minimum" /> },
      ]
    case 'bridge':
      return [
        {
          label: 'From',
          content: (
            <Endpoint image={chainLogoUrl(account.chainId)} fallback={account.network[0]} name={account.network} />
          ),
        },
        {
          label: 'To',
          content: kind.destination ? (
            <Endpoint
              image={chainLogoUrl(kind.destinationChainId)}
              fallback={kind.destination[0]}
              name={kind.destination}
            />
          ) : (
            <Endpoint fallback="?" name={`Unknown network · ${kind.destinationChainId}`} tone="warning" />
          ),
        },
      ]
    case 'settings':
    case 'rejection':
      return [{ label: 'Safe', top: true, content: safe }]
    default:
      return [{ label: 'From', top: true, content: safe }, to]
  }
}
