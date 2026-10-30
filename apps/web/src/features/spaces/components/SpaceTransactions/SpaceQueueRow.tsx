import type { ReactElement } from 'react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import MaliciousTxWarning from '@safe-global/views/components/transactions/MaliciousTxWarning'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { formatDateTime, formatTimeInWords } from '@safe-global/utils/utils/date'
import TxInfo from '@/components/transactions/TxInfo'
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
import { getCounterparty, getNonce, type ConflictOption, type QueueStatus } from './utils'

export const QUEUE_COLUMNS = ['Nonce', 'Transaction', 'To', 'Proposed', 'Signatures', 'Status', 'Action'] as const

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

// The options sharing a nonce hang off one line from the group header, so the nonce shows once, in the header.
const ConflictBracket = ({ option, size, nonce }: ConflictOption & { nonce?: number }): ReactElement => {
  const isLast = option === size
  return (
    <span aria-label={`Option ${option} of ${size} at nonce ${nonce}`} role="img" className="block h-6">
      <span
        aria-hidden="true"
        className={`absolute left-1/2 w-3 border-l-[1.5px] border-[var(--warning-accent)] ${
          isLast
            ? 'top-[-30px] h-[calc(50%+30px)] rounded-bl-md border-b-[1.5px]'
            : option === 1
              ? 'top-[-22px] bottom-[-8px]'
              : 'top-[-30px] bottom-[-8px]'
        }`}
      />
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 w-3 border-b-[1.5px] border-[var(--warning-accent)]"
        />
      )}
    </span>
  )
}

type SpaceQueueRowProps = {
  item: TransactionQueuedItem
  chainId: string
  status: QueueStatus
  nextNonce?: number
  conflict?: ConflictOption
}

const SpaceQueueRow = ({ item, chainId, status, nextNonce, conflict }: SpaceQueueRowProps): ReactElement => {
  const { StatusLabel } = useLoadFeature(SwapFeature)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const tx = item.transaction
  const isPending = useIsPending(tx.id)
  const expiredSwap = useIsExpiredSwap(tx.txInfo)

  const nonce = getNonce(tx)
  const executionInfo = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo : undefined
  const showWarning = isImitation(tx) || (hasDefaultTokenlist && !isTrustedTx(tx))

  return (
    <TableRow data-testid="space-queue-row" className="h-14">
      <TableCell className="relative py-2 text-center text-sm tabular-nums text-muted-foreground">
        {conflict ? <ConflictBracket {...conflict} nonce={nonce} /> : nonce}
      </TableCell>

      <TableCell className="py-2">
        <div className="flex min-h-10 min-w-0 items-center gap-2">
          {showWarning && <MaliciousTxWarning withTooltip={!isImitation(tx)} />}
          <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm">
            <TxTypeIcon tx={tx} />
            <TxTypeText tx={tx} />
          </span>
          <span className="min-w-0 truncate text-sm">
            <TxInfo info={tx.txInfo} />
          </span>
        </div>
      </TableCell>

      <TableCell className="py-2">
        <Counterparty txInfo={tx.txInfo} chainId={chainId} />
      </TableCell>

      <TableCell className="text-sm">
        <Tooltip delay={150}>
          <TooltipTrigger className="truncate">{formatTimeInWords(tx.timestamp)}</TooltipTrigger>
          <TooltipContent>{formatDateTime(tx.timestamp)}</TooltipContent>
        </Tooltip>
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

      <TableCell>
        <div className="flex items-center justify-end">{!expiredSwap && <QueueActions tx={tx} dense />}</div>
      </TableCell>
    </TableRow>
  )
}

export default SpaceQueueRow
