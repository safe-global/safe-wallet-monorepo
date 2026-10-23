import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { getAccount, getTransactionLabel } from '../../services/model'
import type { Proposal } from '../../types'

// Fleet admin: rows shared by the Safe and member drawers.
export function LinkRow({
  title,
  detail,
  badge,
  onClick,
}: {
  title: ReactNode
  detail: ReactNode
  badge?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      {badge}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={ICON_STROKE} aria-hidden="true" />
    </button>
  )
}

export function TxList({ txs, empty, onOpenTx }: { txs: Proposal[]; empty: string; onOpenTx: (tx: Proposal) => void }) {
  if (!txs.length) return <p className="px-2 text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="flex flex-col">
      {txs.map((tx) => (
        <LinkRow
          key={tx.id}
          title={getTransactionLabel(tx)}
          detail={`${getAccount(tx).name} · #${tx.nonce} · ${tx.age}`}
          onClick={() => onOpenTx(tx)}
        />
      ))}
    </div>
  )
}
