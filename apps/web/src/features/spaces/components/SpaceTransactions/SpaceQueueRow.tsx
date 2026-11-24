import { useCallback, useEffect, useRef, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'
import {
  QueueProposerMark,
  QueueWarningMarker,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueRowMarks'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { formatDateTime, formatShortTimeAgo } from '@safe-global/utils/utils/date'
import QueueActions from '@/components/transactions/TxSummary/QueueActions'
import StatusLabel from '@/features/swap/public/components/StatusLabel'
import useIsExpiredSwap from '@/features/swap/public/hooks/useIsExpiredSwap'
import useChains, { useHasFeature } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectPendingTxById } from '@/store/pendingTxsSlice'
import { isBridgeOrderTxInfo, isMultisigExecutionInfo } from '@/utils/transaction-guards'
import Identicon from '@safe-global/views/components/common/Identicon'
import ImageFallback from '@safe-global/views/components/common/ImageFallback'
import QueueParty from '@safe-global/views/features/spaces/components/SpaceQueue/QueuePartyCard'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import PartyCard from './QueueParty/PartyCard'
import QueueRowSafeTag from './QueueRowSafeTag'
import QueueTxDetails from './QueueTxDetails'
import BlockedByButton from '@safe-global/views/features/spaces/components/SpaceQueue/BlockedByButton'
import ConflictBracket from '@safe-global/views/features/spaces/components/SpaceQueue/ConflictBracket'
import QueueNonce from '@safe-global/views/features/spaces/components/SpaceQueue/QueueNonce'
import { QueueTriggerHint } from '@safe-global/views/features/spaces/components/SpaceQueue/QueueHint'
import type { ConflictOption, QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { QUEUE_COLUMNS, QUEUE_PINNED_COLUMNS } from '@safe-global/views/features/spaces/components/SpaceQueue/columns'
import RowActionsMenu from './RowActionsMenu'
import SignersTooltip from './SignersTooltip'
import { cn } from '@safe-global/views/utils/cn'
import { useQueueGoTo, useRowHighlight, type HighlightPhase } from './SpaceQueueTable/queueNavigation'
import {
  getBlockedBy,
  getBlockedByHint,
  getCounterparty,
  getNonce,
  getNonceHint,
  getQueueWarnings,
  getSignHint,
} from './utils'
import { NonceTakenAction, PendingRowAction, useIsNonceExecutingElsewhere } from './PendingRowAction'

const PartyAvatar = ({ address, logoUri, size }: { address: string; logoUri?: string | null; size: number }) => {
  const identicon = <Identicon address={address} size={size} />
  return logoUri ? (
    <ImageFallback
      src={logoUri}
      fallbackComponent={identicon}
      alt=""
      className="shrink-0 rounded-full"
      style={{ width: size, height: size }}
    />
  ) : (
    identicon
  )
}

/** The other party's avatar and name; hovering or focusing it shows its party card */
const CounterpartyParty = ({ party, chainId }: { party: AddressInfo; chainId: string }): ReactElement => {
  const contact = useAddressBookItem(party.value, chainId)
  const name = contact?.name || party.name || undefined
  return (
    <QueueParty
      trigger={
        <span
          data-testid="counterparty-party"
          tabIndex={0}
          className="flex min-w-0 items-center gap-1.5 rounded-sm outline-hidden focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
        />
      }
      card={
        <PartyCard
          address={party.value}
          chainId={chainId}
          name={name}
          avatar={<PartyAvatar address={party.value} logoUri={party.logoUri} size={32} />}
        />
      }
    >
      {/* Grayscale only tints the avatar: the name is already a neutral colour */}
      <span className="flex shrink-0 grayscale group-hover/transaction:grayscale-0">
        <PartyAvatar address={party.value} logoUri={party.logoUri} size={20} />
      </span>
      {/* Unnamed, the short address is monospaced like any other address */}
      <span className={cn('min-w-0 truncate', !name && 'font-mono text-xs')}>
        {name ?? shortenAddress(party.value)}
      </span>
    </QueueParty>
  )
}

export const Counterparty = ({
  txInfo,
  chainId,
}: {
  txInfo: TransactionInfo
  chainId: string
}): ReactElement | null => {
  const counterparty = getCounterparty(txInfo)
  if (!counterparty) return null
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm">
      {/* A plain word in the sentence. Fixed width, the widest being "from", so the names line up whichever it is */}
      <span
        data-testid="counterparty-join"
        className="w-8 shrink-0 text-muted-foreground group-hover/transaction:text-foreground"
      >
        {counterparty.join}
      </span>
      {'protocol' in counterparty ? (
        <span className="min-w-0 truncate">{counterparty.protocol}</span>
      ) : (
        <CounterpartyParty party={counterparty.party} chainId={chainId} />
      )}
    </span>
  )
}

// Layout B's widths as the basis, the same on every row: when Details is narrower, the summary and the counterparty
// shrink by the same amount on every row and truncate, so each part still lines up down the table
const DetailsSlot = ({ className, children }: { className: string; children?: ReactNode }): ReactElement => (
  <span className={`flex min-w-0 items-center ${className}`}>{children}</span>
)

/** Short proposed time ("5h ago"), with the full date and time in the tooltip */
export const ProposedTime = ({ timestamp }: { timestamp: number }): ReactElement => (
  <Tooltip delay={QUEUE_TOOLTIP_DELAY}>
    <TooltipTrigger className="truncate">{formatShortTimeAgo(timestamp)}</TooltipTrigger>
    <TooltipContent>{formatDateTime(timestamp)}</TooltipContent>
  </Tooltip>
)

// Painted on the cells like the hover pill, so it sits inside the row's insets with the same rounded ends
const HIGHLIGHT_CLASSES: Record<HighlightPhase, string> = {
  on: '[&>td]:bg-accent [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg',
  fading:
    '[&>td]:transition-colors [&>td]:duration-700 motion-reduce:[&>td]:transition-none [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg',
}

type SpaceQueueRowProps = {
  item: TransactionQueuedItem
  chainId: string
  status: QueueStatus
  nextNonce?: number
  /** Where the Safe's next nonce stands for the user: what a blocked row waits on */
  nextStatus?: QueueStatus
  conflict?: ConflictOption
  /** False when a rejection already holds this nonce */
  canReject?: boolean
  /** The user signed another option at this nonce */
  signedOther?: boolean
  safeAddress: string
  rowProps?: ComponentProps<'tr'>
  /** Phones: one cell beside the nonce */
  compact?: boolean
}

const SpaceQueueRow = ({
  item,
  chainId,
  status,
  nextNonce,
  nextStatus,
  conflict,
  canReject = true,
  signedOther,
  safeAddress,
  rowProps,
  compact = false,
}: SpaceQueueRowProps): ReactElement => {
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const tx = item.transaction
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, tx.id))
  const expiredSwap = useIsExpiredSwap(tx.txInfo)

  const nonce = getNonce(tx)
  const nonceTaken = useIsNonceExecutingElsewhere(tx.id, chainId, safeAddress, nonce)
  const executionInfo = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo : undefined
  const { configs } = useChains()
  const bridgeTo = isBridgeOrderTxInfo(tx.txInfo) ? tx.txInfo.toChain : undefined
  const warnings = getQueueWarnings({
    tx,
    safeAddress,
    checksTokens: !!hasDefaultTokenlist,
    expired: expiredSwap,
    unknownNetwork: !!bridgeTo && configs.length > 0 && !configs.some((chain) => chain.chainId === bridgeTo),
  })
  const proposedOnly = executionInfo?.confirmationsSubmitted === 0
  const goTo = useQueueGoTo()
  const blockedBy = pendingTx ? undefined : getBlockedBy(status, nonce, nextNonce)

  const { phase, seq, takeFocus } = useRowHighlight(tx.id)
  const rowRef = useRef<HTMLTableRowElement | null>(null)
  const measureRef = rowProps?.ref
  const setRowRef = useCallback(
    (element: HTMLTableRowElement | null) => {
      rowRef.current = element
      if (typeof measureRef === 'function') measureRef(element)
      else if (measureRef) measureRef.current = element
    },
    [measureRef],
  )
  useEffect(() => {
    if (seq !== undefined && takeFocus()) rowRef.current?.focus({ preventScroll: true })
  }, [seq, takeFocus])

  const gauge = executionInfo && (
    <SignersTooltip
      chainId={chainId}
      txId={tx.id}
      safeAddress={safeAddress}
      status={status}
      nonce={nonce}
      nextNonce={nextNonce}
      submitted={executionInfo.confirmationsSubmitted}
      required={executionInfo.confirmationsRequired}
    />
  )

  const action = (
    <div className="flex items-center justify-end gap-1">
      {/* The status is in the gauge: what the gauge can't show takes the place of the button */}
      {pendingTx ? (
        <PendingRowAction txId={tx.id} pendingTx={pendingTx} />
      ) : expiredSwap ? (
        <QueueTriggerHint hint="This order expired. Reject or delete it to free the nonce.">
          <StatusLabel status="expired" />
        </QueueTriggerHint>
      ) : nonceTaken && nonce !== undefined ? (
        <NonceTakenAction tx={tx} nonce={nonce} />
      ) : blockedBy !== undefined ? (
        <BlockedByButton
          nonce={blockedBy}
          hint={getBlockedByHint(blockedBy, nextStatus)}
          onClick={() => goTo?.({ safeAddress, chainId, nonce: blockedBy, status: nextStatus })}
        />
      ) : (
        <QueueActions tx={tx} dense signHint={getSignHint({ tx, status, nextNonce, signedOther })} />
      )}
      <RowActionsMenu tx={tx} canReject={canReject} />
    </div>
  )

  return (
    <TableRow
      data-testid="space-queue-row"
      {...rowProps}
      ref={setRowRef}
      tabIndex={-1}
      data-highlighted={phase}
      data-no-hover={phase === 'on' ? '' : undefined}
      className={cn(
        'group/transaction outline-hidden focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        !compact && 'h-14',
        phase && HIGHLIGHT_CLASSES[phase],
      )}
    >
      <TableCell
        data-pin={QUEUE_PINNED_COLUMNS.Nonce}
        className="relative py-2 text-center text-sm tabular-nums text-muted-foreground group-hover/transaction:text-foreground"
      >
        {conflict ? (
          <ConflictBracket {...conflict} nonce={nonce} />
        ) : (
          <QueueNonce nonce={nonce} {...getNonceHint(status, nonce, nextNonce)} />
        )}
      </TableCell>

      {compact ? (
        <TableCell colSpan={QUEUE_COLUMNS.length - 1} className="py-2">
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <span className="flex min-w-0 max-w-[50%] shrink-0">
                <QueueRowSafeTag safeAddress={safeAddress} chainId={chainId} />
              </span>
              <span className="min-w-0 truncate">
                <QueueTxDetails.Summary tx={tx} />
              </span>
              {warnings.length > 0 && <QueueWarningMarker warnings={warnings} />}
            </span>
            {/* Wraps under the gauge sooner than overflow: the action has to stay in view */}
            <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              {gauge}
              <span className="ml-auto">{action}</span>
            </span>
          </span>
        </TableCell>
      ) : (
        <>
          <TableCell className="py-2">
            <span className="flex min-w-0">
              <QueueRowSafeTag safeAddress={safeAddress} chainId={chainId} />
            </span>
          </TableCell>

          <TableCell className="py-2">
            <span className="flex min-w-0">
              <QueueTxDetails.Type tx={tx} />
            </span>
          </TableCell>

          <TableCell className="py-2">
            <span className="flex min-h-10 min-w-0 items-center gap-3">
              <DetailsSlot className="shrink basis-40 gap-1.5 text-sm">
                <span className="min-w-0 truncate">
                  <QueueTxDetails.Summary tx={tx} />
                </span>
                {warnings.length > 0 && <QueueWarningMarker warnings={warnings} />}
              </DetailsSlot>
              <DetailsSlot className="shrink basis-44">
                <Counterparty txInfo={tx.txInfo} chainId={chainId} />
              </DetailsSlot>
              <DetailsSlot className="shrink-0 gap-1.5 text-sm text-muted-foreground group-hover/transaction:text-foreground">
                <span className="flex w-16 min-w-0">
                  <ProposedTime timestamp={tx.timestamp} />
                </span>
                {proposedOnly && executionInfo && <QueueProposerMark threshold={executionInfo.confirmationsRequired} />}
              </DetailsSlot>
            </span>
          </TableCell>

          <TableCell className="py-1">
            <span className="flex min-w-0 items-center">{gauge}</span>
          </TableCell>

          <TableCell data-pin={QUEUE_PINNED_COLUMNS.Action}>{action}</TableCell>
        </>
      )}
    </TableRow>
  )
}

export default SpaceQueueRow
