import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight, Split } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Button } from '@safe-global/views/components/ui/button'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import {
  getAccount,
  getConflicts,
  getRowState,
  getSignatureCount,
  getTransactionLabel,
  getTypeLabel,
} from '../../services/model'
import { getCounterpartyCell, getSummary } from '../../services/columns'
import { getLockingTx } from '../../services/execution'
import { getPrimaryAction } from '../../services/actions'
import type { Proposal } from '../../types'
import { RowActions, type RowActionsProps } from './RowActions'
import { StatusChip, TYPE_ICONS } from '../shared'
import { CopyableParty } from '../CopyableParty'
import { SignatureGauge } from './SignatureGauge'
import { ExecutionChip, LockedChip } from './ExecutionStatus'
import { hasCounterparty } from './TransactionLine'

type CompactQueueListProps = Omit<RowActionsProps, 'tx' | 'hovered' | 'onReplaceHover'> & { rows: Proposal[] }

// Phone layout with almost no text: the Safe tag, the amount, signatures, status and the table's buttons.
export function CompactQueueList({ rows, ...props }: CompactQueueListProps) {
  const { items, persona, remindedIds, executions = {} } = props
  // Rows come most urgent first. Only the first one you can sign or execute gets a filled button.
  const urgentId = rows.find(
    (tx) =>
      !executions[tx.id] &&
      !getLockingTx(tx, items, executions) &&
      getPrimaryAction(tx, items, persona, remindedIds, 'row').kind === 'flow',
  )?.id
  // M2: chevrons while the rows scroll, the table's buttons once you reach the right edge.
  const scroller = useRef<HTMLDivElement>(null)
  const [atEnd, setAtEnd] = useState(true)
  const measure = useCallback(() => {
    const el = scroller.current
    if (el) setAtEnd(el.scrollWidth - el.clientWidth - el.scrollLeft <= 4)
  }, [])
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, rows.length])
  return (
    // One line per row. Rows that don't fit scroll sideways, and the button or chevron stays pinned on the right.
    <div ref={scroller} onScroll={measure} className="overflow-x-auto rounded-lg border border-border bg-card">
      <ul aria-label="Pending transactions" className="flex w-max min-w-full flex-col">
        {rows.map((tx) => (
          <CompactRow key={tx.id} tx={tx} filled={tx.id === urgentId} atEnd={atEnd} {...props} />
        ))}
      </ul>
    </div>
  )
}

function CompactRow({
  atEnd,
  ...props
}: Omit<CompactQueueListProps, 'rows'> & { tx: Proposal; filled: boolean; atEnd: boolean }) {
  const { tx, items, persona, remindedIds, executions = {}, now = Date.now(), onReview, milestone = 2 } = props
  // M2: the row opens the full-screen drawer, which has the actions. M1 has no drawer, so rows keep their buttons.
  const showActions = milestone === 1
  const account = getAccount(tx)
  const label = getTransactionLabel(tx)
  const counterparty = getCounterpartyCell(tx)
  const TypeIcon = TYPE_ICONS[getTypeLabel(tx)]
  const signatureCount = getSignatureCount(tx)
  const execution = executions[tx.id]
  const lockedBy = execution ? undefined : getLockingTx(tx, items, executions)
  const conflicting = getConflicts(tx, items).length > 0
  const state = getRowState(tx, persona)
  const action = getPrimaryAction(tx, items, persona, remindedIds, 'row')
  // The button already says it: no "Ready to execute" next to Execute, no "Ready to sign" next to Sign.
  const repeatsButton =
    showActions &&
    ((state.label === 'Ready to execute' && action.label === 'Execute') ||
      (state.label === 'Ready to sign' && action.label === 'Sign'))

  return (
    <li
      aria-label={label}
      className="flex cursor-pointer items-center gap-3 whitespace-nowrap border-b border-border min-h-16 py-3 pl-3 last:border-b-0 active:bg-muted"
      onClick={() => onReview(tx)}
    >
      {/* The table's Safe tag: avatar, name and network. */}
      <span className="flex max-w-36 shrink-0">
        <CopyableParty
          name={account.safeName ?? account.name}
          address={account.iconAddress}
          network={{ chainId: account.chainId, name: account.network }}
          tag
        />
      </span>
      <span className="flex items-center gap-1.5 text-sm">
        {tx.app ? (
          <Avatar className="size-4 shrink-0" aria-label={tx.app.name}>
            {tx.app.logo && <AvatarImage src={tx.app.logo} alt="" />}
            <AvatarFallback className="text-[10px]">{tx.app.name[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <TypeIcon
            className="size-4 shrink-0 text-muted-foreground"
            strokeWidth={ICON_STROKE}
            aria-label={getTypeLabel(tx)}
          />
        )}
        <span className="max-w-40 truncate font-medium tabular-nums">{getSummary(tx)}</span>
        {hasCounterparty(tx) && (
          // Grey and small, so the amount leads and only the Safe's icon is in colour.
          <span className="flex shrink-0 grayscale opacity-70" role="img" aria-label={`With ${counterparty.name}`}>
            {counterparty.contract || counterparty.logo ? (
              <Avatar className="size-4">
                {counterparty.logo && <AvatarImage src={counterparty.logo} alt="" />}
                <AvatarFallback className="text-[10px]">{counterparty.name[0]}</AvatarFallback>
              </Avatar>
            ) : (
              <Identicon address={counterparty.avatar ?? counterparty.address ?? ''} size={16} />
            )}
          </span>
        )}
      </span>
      <span
        className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground"
        aria-label={`${signatureCount} of ${account.threshold} signatures`}
      >
        <SignatureGauge count={signatureCount} threshold={account.threshold} />
        {signatureCount}/{account.threshold}
      </span>
      <span className="flex items-center gap-1.5">
        {execution ? (
          <ExecutionChip execution={execution} now={now} />
        ) : lockedBy ? (
          <LockedChip by={lockedBy} />
        ) : (
          !repeatsButton && <StatusChip tone={state.tone}>{state.label}</StatusChip>
        )}
        {conflicting && (
          <Split className="size-3.5 shrink-0 text-warning-strong" strokeWidth={ICON_STROKE} aria-label="Conflicting" />
        )}
      </span>
      {/* Pinned to the right edge, so the button or chevron stays in view while the row scrolls. */}
      {showActions ? (
        <span className="sticky right-0 ml-auto flex items-center self-stretch bg-card pr-2 pl-1">
          <RowActions {...props} fit />
        </span>
      ) : (
        // Fixed width, so swapping the chevron for the buttons doesn't change how far the rows scroll.
        <span
          className={`sticky right-0 ml-auto flex w-28 shrink-0 items-center justify-end self-stretch pr-2 ${atEnd ? 'bg-card' : 'bg-transparent bg-linear-to-r from-transparent via-card via-50% to-card'}`}
        >
          <span className="flex rounded-md bg-card pl-1">
            {atEnd ? (
              <RowActions {...props} fit />
            ) : (
              // Light grey and 40px tall, so it reads as a button before you scroll to the copy.
              <Button
                variant="secondary"
                size="lg"
                aria-label={`Open ${label}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onReview(tx)
                }}
              >
                <ChevronRight className="text-muted-foreground" aria-hidden="true" />
              </Button>
            )}
          </span>
        </span>
      )}
    </li>
  )
}
