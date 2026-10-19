import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { getCounterpartyCell, getDetail, getHeadline } from '../../../services/columns'
import { getAccount, getRecipientName, getToken } from '../../../services/model'
import type { Proposal } from '../../../types'
import { chainLogoUrl } from '../../shared'
import { IdentityRow } from './IdentityRow'

// The production "from → to" summary, for each transaction type.

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
    <span className="flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        {image && <AvatarImage src={image} alt="" />}
        <AvatarFallback data-surface="card">{fallback}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className={`block truncate text-sm ${tone === 'warning' ? 'text-warning-strong' : ''}`}>{name}</span>
        {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
    </span>
  )
}

const amountOf = (value: string) => value.split(' ')[0]

export function FlowBlock({ tx }: { tx: Proposal }) {
  const account = getAccount(tx)
  const { kind } = tx
  const safe = (
    <IdentityRow name={account.name} address={account.iconAddress} chainId={account.chainId} avatarSize={32} />
  )
  const counterparty = getCounterpartyCell(tx)
  const to = (
    <IdentityRow
      name={counterparty.name}
      address={counterparty.address}
      avatar={counterparty.avatar}
      detail={counterparty.detail}
      tone={counterparty.tone}
      chainId={account.chainId}
      avatarSize={32}
    />
  )
  let from: ReactNode = safe
  let target: ReactNode | undefined = to
  let moves = [getHeadline(tx), getDetail(tx)].filter(Boolean).join(' · ')
  switch (kind.type) {
    case 'transfer':
      moves = [getHeadline(tx), tx.fiat].filter(Boolean).join(' · ')
      break
    case 'swap':
      from = <Endpoint fallback={getToken(kind.sell)[0]} name={kind.sell} detail="Sell" />
      target = <Endpoint fallback={getToken(kind.buy)[0]} name={kind.buy} detail="Buy · minimum" />
      moves = [
        `via ${getRecipientName(tx)}`,
        kind.order === 'market' ? 'Market' : kind.order === 'limit' ? 'Limit' : 'TWAP',
        kind.expiry,
      ].join(' · ')
      break
    case 'bridge':
      from = (
        <Endpoint
          image={chainLogoUrl(account.chainId)}
          fallback={account.network[0]}
          name={account.network}
          detail={account.name}
        />
      )
      target = kind.destination ? (
        <Endpoint
          image={chainLogoUrl(kind.destinationChainId)}
          fallback={kind.destination[0]}
          name={kind.destination}
          detail="This Safe account"
        />
      ) : (
        <Endpoint fallback="?" name="Unknown network" detail={`Chain ${kind.destinationChainId}`} tone="warning" />
      )
      moves = [
        `${amountOf(kind.sell)} ${getToken(kind.sell)}`,
        `via ${getRecipientName(tx)}`,
        `Fees ${kind.fees}`,
      ].join(' · ')
      break
    case 'contract':
      moves = [`Call ${kind.method}`, tx.amount].filter(Boolean).join(' · ')
      break
    case 'settings':
    case 'rejection':
      target = undefined
      break
  }
  return (
    <section aria-label="What moves where" className="rounded-lg bg-muted p-3">
      {target ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <span className="min-w-0">{from}</span>
          <ArrowRight className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} aria-label="to" />
          <span className="min-w-0">{target}</span>
        </div>
      ) : (
        <span className="block min-w-0">{safe}</span>
      )}
      <p className="mt-3 border-t border-border pt-3 text-center text-sm font-medium tabular-nums">{moves}</p>
    </section>
  )
}
