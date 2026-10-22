import { useState, type ReactElement } from 'react'
import { StickyNote } from 'lucide-react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import MaliciousTxWarning from '@safe-global/views/components/transactions/MaliciousTxWarning'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { formatDateTime, formatTimeInWords } from '@safe-global/utils/utils/date'
import TxInfo from '@/components/transactions/TxInfo'
import TxDetails from '@/components/transactions/TxDetails'
import TxStatusLabel from '@/components/transactions/TxStatusLabel'
import QueueActions from '@/components/transactions/TxSummary/QueueActions'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import { SwapFeature, useIsExpiredSwap } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { useHasFeature } from '@/hooks/useChains'
import useIsPending from '@/hooks/useIsPending'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import SignatureGauge from './SignatureGauge'
import { getCounterparty, getNonce, type QueueStatus } from './utils'

export const QUEUE_COLUMNS = ['Nonce', 'Transaction', 'Proposed', 'Note', 'Signatures', 'Status', 'Action'] as const

const STATUS_TONES: Record<QueueStatus, 'success' | 'warning'> = {
  execute: 'success',
  sign: 'success',
  waiting: 'warning',
  blocked: 'warning',
}

const getStatusLabel = (status: QueueStatus, nextNonce: number | undefined): string => {
  if (status === 'execute') return 'Execute'
  if (status === 'sign') return 'Sign'
  if (status === 'waiting') return 'Waiting'
  return nextNonce === undefined ? 'Blocked' : `Blocked by #${nextNonce}`
}

export const StatusChip = ({ status, nextNonce }: { status: QueueStatus; nextNonce?: number }): ReactElement => (
  <Badge variant={STATUS_TONES[status]} size="status" shape="status">
    <BadgeDot />
    {getStatusLabel(status, nextNonce)}
  </Badge>
)

const Counterparty = ({ txInfo, chainId }: { txInfo: TransactionInfo; chainId: string }): ReactElement | null => {
  const counterparty = getCounterparty(txInfo)
  if (!counterparty) return null
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{counterparty.join}</span>
      <span className="min-w-0 truncate">
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
      </span>
    </span>
  )
}

type SpaceQueueRowProps = {
  item: TransactionQueuedItem
  chainId: string
  status: QueueStatus
  nextNonce?: number
  inConflict: boolean
}

const SpaceQueueRow = ({ item, chainId, status, nextNonce, inConflict }: SpaceQueueRowProps): ReactElement => {
  const { StatusLabel } = useLoadFeature(SwapFeature)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const tx = item.transaction
  const isPending = useIsPending(tx.id)
  const expiredSwap = useIsExpiredSwap(tx.txInfo)
  // Details mount on first expand and stay mounted, so a row only requests its details once opened
  const [expanded, setExpanded] = useState(false)
  const [hasExpanded, setHasExpanded] = useState(false)

  const nonce = getNonce(tx)
  const executionInfo = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo : undefined
  const showWarning = isImitation(tx) || (hasDefaultTokenlist && !isTrustedTx(tx))

  const toggle = () => {
    setExpanded((value) => !value)
    setHasExpanded(true)
  }

  return (
    <>
      <TableRow
        data-testid="space-queue-row"
        data-state={expanded ? 'selected' : undefined}
        data-no-divider={expanded || undefined}
        aria-expanded={expanded}
        className="h-14 cursor-pointer"
        onClick={toggle}
      >
        <TableCell className="py-2 text-center text-sm tabular-nums text-muted-foreground">
          {inConflict ? null : nonce}
        </TableCell>

        <TableCell className="py-2">
          <div className="flex min-h-10 min-w-0 items-center gap-2">
            {showWarning && <MaliciousTxWarning withTooltip={!isImitation(tx)} />}
            <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm">
              <TxTypeIcon tx={tx} />
              <TxTypeText tx={tx} />
            </span>
            <span className="shrink-0 text-sm">
              <TxInfo info={tx.txInfo} />
            </span>
            <Counterparty txInfo={tx.txInfo} chainId={chainId} />
          </div>
        </TableCell>

        <TableCell className="text-sm">
          <Tooltip delay={150}>
            <TooltipTrigger className="truncate" onClick={(event) => event.stopPropagation()}>
              {formatTimeInWords(tx.timestamp)}
            </TooltipTrigger>
            <TooltipContent>{formatDateTime(tx.timestamp)}</TooltipContent>
          </Tooltip>
        </TableCell>

        <TableCell>
          {tx.note && (
            <Tooltip delay={150}>
              <TooltipTrigger
                aria-label={`Note: ${tx.note}`}
                className="flex items-center text-muted-foreground hover:text-foreground"
                onClick={(event) => event.stopPropagation()}
              >
                <StickyNote className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm whitespace-normal">{tx.note}</TooltipContent>
            </Tooltip>
          )}
        </TableCell>

        <TableCell className="py-1">
          {executionInfo && (
            <span className="flex items-center gap-1.5 text-sm tabular-nums">
              <SignatureGauge
                count={executionInfo.confirmationsSubmitted}
                threshold={executionInfo.confirmationsRequired}
              />
              {executionInfo.confirmationsSubmitted}/{executionInfo.confirmationsRequired}
            </span>
          )}
        </TableCell>

        <TableCell>
          {expiredSwap ? (
            <StatusLabel status="expired" />
          ) : isPending ? (
            <TxStatusLabel tx={tx} />
          ) : (
            <StatusChip status={status} nextNonce={nextNonce} />
          )}
        </TableCell>

        <TableCell onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-end">{!expiredSwap && <QueueActions tx={tx} dense />}</div>
        </TableCell>
      </TableRow>

      {hasExpanded && (
        <TableRow data-no-hover hidden={!expanded} data-testid="space-queue-row-details">
          <TableCell colSpan={QUEUE_COLUMNS.length} className="whitespace-normal p-0">
            <TxDetails txSummary={tx} contrastSurface />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default SpaceQueueRow
