import { useCallback, useEffect, useRef, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import MaliciousTxWarning from '@safe-global/views/components/transactions/MaliciousTxWarning'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { formatDateTime, formatShortTimeAgo } from '@safe-global/utils/utils/date'
import TxStatusLabel from '@/components/transactions/TxStatusLabel'
import QueueActions from '@/components/transactions/TxSummary/QueueActions'
import StatusLabel from '@/features/swap/public/components/StatusLabel'
import useIsExpiredSwap from '@/features/swap/public/hooks/useIsExpiredSwap'
import { useHasFeature } from '@/hooks/useChains'
import useIsPending from '@/hooks/useIsPending'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import QueueRowSafeTag from './QueueRowSafeTag'
import QueueTxDetails from './QueueTxDetails'
import BlockedByButton from '@safe-global/views/features/spaces/components/SpaceQueue/BlockedByButton'
import ConflictBracket from '@safe-global/views/features/spaces/components/SpaceQueue/ConflictBracket'
import type { ConflictOption, QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import RowActionsMenu from './RowActionsMenu'
import SignersTooltip from './SignersTooltip'
import { cn } from '@safe-global/views/utils/cn'
import { useQueueGoTo, useRowHighlight, type HighlightPhase } from './SpaceQueueTable/queueNavigation'
import { getBlockedByHint, getCounterparty, getNonce } from './utils'

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
      {/* Grayscale only tints the avatar: the name is already a neutral colour. EthHashInfo's name box doesn't shrink
        on its own, so it is let shrink here to end in an ellipsis. */}
      <span className="min-w-0 truncate grayscale group-hover/transaction:grayscale-0 [&_.ethHashInfo-name]:min-w-0">
        {'protocol' in counterparty ? (
          counterparty.protocol
        ) : (
          <EthHashInfo
            address={counterparty.party.value}
            name={counterparty.party.name}
            customAvatar={counterparty.party.logoUri}
            chainId={chainId}
            onlyName
            shortAddress
            showPrefix={false}
            showCopyButton={false}
            hasExplorer={false}
            avatarSize={20}
          />
        )}
      </span>
    </span>
  )
}

// The transaction type: a grey tag on the row, white while the row is hovered
const TYPE_TAG =
  'flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm group-hover/transaction:bg-card'

// Layout B's widths as the basis, the same on every row: when Details is narrower, the summary and the counterparty
// shrink by the same amount on every row and truncate, so each part still lines up down the table
const DetailsSlot = ({ className, children }: { className: string; children?: ReactNode }): ReactElement => (
  <span className={`flex min-w-0 items-center ${className}`}>{children}</span>
)

/** Short proposed time ("5h ago"), with the full date and time in the tooltip */
export const ProposedTime = ({ timestamp }: { timestamp: number }): ReactElement => (
  <Tooltip delay={150}>
    <TooltipTrigger className="truncate">{formatShortTimeAgo(timestamp)}</TooltipTrigger>
    <TooltipContent>{formatDateTime(timestamp)}</TooltipContent>
  </Tooltip>
)

/** A label that may not fit the Status column: it truncates, with the full text in the tooltip */
const StatusLabelSlot = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <Tooltip delay={150}>
    <TooltipTrigger render={<span data-testid="queue-row-status-label" className="flex min-w-0 overflow-hidden" />}>
      {children}
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
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
  safeAddress: string
  rowProps?: ComponentProps<'tr'>
}

const SpaceQueueRow = ({
  item,
  chainId,
  status,
  nextNonce,
  nextStatus,
  conflict,
  canReject = true,
  safeAddress,
  rowProps,
}: SpaceQueueRowProps): ReactElement => {
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const tx = item.transaction
  const isPending = useIsPending(tx.id)
  const expiredSwap = useIsExpiredSwap(tx.txInfo)
  const txStatusLabel = useTransactionStatus(tx)

  const nonce = getNonce(tx)
  const executionInfo = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo : undefined
  const showWarning = isImitation(tx) || (hasDefaultTokenlist && !isTrustedTx(tx))
  const goTo = useQueueGoTo()
  const blockedBy = status === 'blocked' && !isPending ? nextNonce : undefined

  const { phase, takeFocus } = useRowHighlight(tx.id)
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
    if (phase && takeFocus()) rowRef.current?.focus({ preventScroll: true })
  }, [phase, takeFocus])

  return (
    <TableRow
      data-testid="space-queue-row"
      {...rowProps}
      ref={setRowRef}
      tabIndex={-1}
      data-highlighted={phase}
      data-no-hover={phase === 'on' ? '' : undefined}
      className={cn(
        'group/transaction h-14 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        phase && HIGHLIGHT_CLASSES[phase],
      )}
    >
      <TableCell className="relative py-2 text-center text-sm tabular-nums text-muted-foreground group-hover/transaction:text-foreground">
        {conflict ? <ConflictBracket {...conflict} nonce={nonce} /> : nonce}
      </TableCell>

      <TableCell className="py-2">
        <span className="flex min-w-0">
          <QueueRowSafeTag safeAddress={safeAddress} chainId={chainId} />
        </span>
      </TableCell>

      <TableCell className="py-2">
        <span className="flex min-w-0">
          <span className={TYPE_TAG}>
            <QueueTxDetails.Type tx={tx} />
          </span>
        </span>
      </TableCell>

      <TableCell className="py-2">
        <span className="flex min-h-10 min-w-0 items-center gap-3">
          <DetailsSlot className="shrink basis-40 gap-1.5 text-sm">
            <span className="min-w-0 truncate">
              <QueueTxDetails.Summary tx={tx} />
            </span>
            {showWarning && <MaliciousTxWarning withTooltip={!isImitation(tx)} />}
          </DetailsSlot>
          <DetailsSlot className="shrink basis-44">
            <Counterparty txInfo={tx.txInfo} chainId={chainId} />
          </DetailsSlot>
          <DetailsSlot className="w-16 shrink-0 text-sm text-muted-foreground group-hover/transaction:text-foreground">
            <ProposedTime timestamp={tx.timestamp} />
          </DetailsSlot>
        </span>
      </TableCell>

      <TableCell className="py-1">
        <span className="flex min-w-0 items-center gap-2">
          {executionInfo && (
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
          )}
          {/* The everyday status is in the gauge: only these exceptions keep a label */}
          {expiredSwap ? (
            <StatusLabelSlot label="Expired">
              <StatusLabel status="expired" />
            </StatusLabelSlot>
          ) : (
            isPending && (
              <StatusLabelSlot label={txStatusLabel}>
                <TxStatusLabel tx={tx} />
              </StatusLabelSlot>
            )
          )}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {expiredSwap ? null : blockedBy !== undefined ? (
            <BlockedByButton
              nonce={blockedBy}
              hint={getBlockedByHint(blockedBy, nextStatus)}
              onClick={() => goTo?.({ safeAddress, chainId, nonce: blockedBy })}
            />
          ) : (
            <QueueActions tx={tx} dense />
          )}
          <RowActionsMenu tx={tx} canReject={canReject} />
        </div>
      </TableCell>
    </TableRow>
  )
}

export default SpaceQueueRow
