import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import ExplorerButton from '@/components/common/ExplorerButton'
import {
  AuditLogView as AuditLog,
  AuditLogHeaderView as AuditLogHeader,
  type AuditRowViewProps,
} from '@/components/common/AuditLog/AuditLogView'
import ExplorerFallbackIcon from '@/public/images/common/link.svg'
import HashIcon from '@/public/images/common/hash.svg'

const WAITING_STATUSES = new Set([
  'Awaiting confirmations',
  'Awaiting execution',
  'Needs your confirmation',
  'Awaiting review',
])
const shortenAuditStatus = (status: string): string => (WAITING_STATUSES.has(status) ? 'Waiting' : status)

export type TxSignersAuditRowProps = Omit<AuditRowViewProps, 'copied' | 'onCopy'>

export type CopyTxHashButtonViewProps = {
  txHash?: string | null
  copied: boolean
  onCopy: () => void
}

export const CopyTxHashButtonView = ({ txHash, copied, onCopy }: CopyTxHashButtonViewProps): ReactElement => {
  if (!txHash) {
    return (
      <Tooltip>
        {/* A disabled button receives neither pointer nor focus events, so the tooltip has to hang
            off a wrapper or the hint is unreachable by every input method. */}
        <TooltipTrigger
          render={
            <span tabIndex={0}>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-inherit"
                disabled
                aria-label="Copy transaction hash"
              >
                <HashIcon className="size-4" />
              </Button>
            </span>
          }
        />
        <TooltipContent side="top">Available after execution</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-testid="copy-tx-hash-btn"
            variant="ghost"
            size="icon-xs"
            className="text-inherit"
            onClick={onCopy}
            // MUI's Tooltip put its `title` on the child as an aria-label; Base UI's wires no ARIA at
            // all, so an icon-only trigger needs its own name or it announces as just "button".
            aria-label="Copy transaction hash"
          >
            <HashIcon className="size-4" />
          </Button>
        }
      />
      <TooltipContent side="top">{copied ? 'Copied' : 'Copy transaction hash'}</TooltipContent>
    </Tooltip>
  )
}

export type TxAuditLogActionsViewProps = {
  copyTxHashButton: ReactNode
  renderShareLink: (children: ReactElement) => ReactNode
  explorerLink?: { title: string; href: string }
}

export const TxAuditLogActionsView = ({
  copyTxHashButton,
  renderShareLink,
  explorerLink,
}: TxAuditLogActionsViewProps): ReactElement => (
  <>
    {copyTxHashButton}
    {/* No Tooltip of its own: TxShareLinkWrapper wraps this in CopyTooltip, which already supplies a
        TooltipTrigger and its own "Copy the transaction URL" content. A second one nested inside
        opened two tooltips at once on hover. The aria-label carries the accessible name. */}
    {renderShareLink(
      <Button
        data-testid="share-tx-link-btn"
        variant="ghost"
        size="icon-xs"
        className="text-inherit"
        aria-label="Copy transaction link"
      >
        <Copy className="size-4" />
      </Button>,
    )}
    {explorerLink ? (
      <ExplorerButton {...explorerLink} isCompact />
    ) : (
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0}>
              <Button variant="ghost" size="icon-xs" disabled aria-label="View on block explorer">
                <ExplorerFallbackIcon className="size-4" />
              </Button>
            </span>
          }
        />
        <TooltipContent side="top">Available after execution</TooltipContent>
      </Tooltip>
    )}
  </>
)

type AuditParty = { address?: string; name?: string }

type TxSignersBaseViewProps = {
  actions: ReactNode
  renderAuditRow: (props: TxSignersAuditRowProps) => ReactNode
  executedAt?: number | null
}

export type TxSignersExecutedViewProps = TxSignersBaseViewProps & {
  executor: AuditParty
}

export const TxSignersExecutedView = ({
  actions,
  renderAuditRow,
  executedAt,
  executor,
}: TxSignersExecutedViewProps): ReactElement => (
  <AuditLog data-testid="transaction-actions-list">
    <AuditLogHeader actions={actions} />
    {renderAuditRow({
      label: 'Executed',
      actionType: 'executed',
      address: executor.address,
      name: executor.name,
      timestamp: executedAt,
      isLast: true,
    })}
  </AuditLog>
)

export type TxSignersModuleViewProps = TxSignersBaseViewProps & {
  creator: AuditParty
  module: AuditParty
}

export const TxSignersModuleView = ({
  actions,
  renderAuditRow,
  executedAt,
  creator,
  module,
}: TxSignersModuleViewProps): ReactElement => (
  <AuditLog data-testid="transaction-actions-list">
    <AuditLogHeader actions={actions} />

    {renderAuditRow({
      label: 'Created',
      actionType: 'created',
      address: creator.address,
      name: creator.name,
      timestamp: executedAt,
    })}

    {renderAuditRow({
      label: 'Executed',
      actionType: 'executed',
      address: module.address,
      name: module.name,
      timestamp: executedAt,
      isLast: true,
    })}
  </AuditLog>
)

export type TxSignersViewProps = TxSignersBaseViewProps & {
  isTxFromProposer: boolean
  isExpired?: boolean
  isCancellation: boolean
  isConfirmed: boolean
  isPending: boolean
  txStatus: string
  proposer: AuditParty
  submittedAt: number
  confirmationsRequired: number
  confirmations: Array<AuditParty & { address: string; submittedAt: number }>
  hasExecutor: boolean
  executor: AuditParty
  showsSafenetRow: boolean
  showExecutionRow: boolean
  safenetRow: ReactNode
}

export const TxSignersView = ({
  actions,
  renderAuditRow,
  executedAt,
  isTxFromProposer,
  isExpired,
  isCancellation,
  isConfirmed,
  isPending,
  txStatus,
  proposer,
  submittedAt,
  confirmationsRequired,
  confirmations,
  hasExecutor,
  executor,
  showsSafenetRow,
  showExecutionRow,
  safenetRow,
}: TxSignersViewProps): ReactElement => {
  const confirmationsNeeded = confirmationsRequired - confirmations.length

  const creationLabel = isTxFromProposer ? 'Proposed' : 'Created'
  const signingLabel = (idx: number) => `Signed (${idx + 1}/${confirmationsRequired})`

  const executionStatus = hasExecutor
    ? 'Executed'
    : isPending
      ? txStatus
      : shortenAuditStatus(isTxFromProposer && !isConfirmed ? 'Awaiting review' : txStatus)

  return (
    <AuditLog data-testid="transaction-actions-list">
      <AuditLogHeader
        chip={
          <TxConfirmations
            submittedConfirmations={confirmations.length}
            requiredConfirmations={confirmationsRequired}
          />
        }
        actions={actions}
      />

      {renderAuditRow({
        label: creationLabel,
        actionType: 'created',
        address: proposer.address,
        name: proposer.name,
        timestamp: submittedAt,
        isLast: confirmations.length === 0 && !showsSafenetRow && !showExecutionRow,
      })}

      {confirmations.map(({ address, name, submittedAt: signedAt }, idx) => (
        <Fragment key={address}>
          {renderAuditRow({
            label: signingLabel(idx),
            actionType: 'signed',
            address,
            name,
            timestamp: signedAt,
            isLast: idx === confirmations.length - 1 && !showsSafenetRow && !showExecutionRow,
          })}
        </Fragment>
      ))}

      {safenetRow}

      {showExecutionRow &&
        renderAuditRow({
          label: executionStatus,
          actionType: 'executed',
          address: executor.address,
          name: executor.name,
          timestamp: executedAt,
          isLast: true,
        })}

      {confirmationsNeeded > 0 && !hasExecutor && !isExpired && (
        <Alert variant="info" className="mt-4">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>
            {isCancellation
              ? 'Cancellation can be executed once the required approvals are collected.'
              : 'Can be executed once the threshold is reached.'}
          </AlertDescription>
        </Alert>
      )}

      {isTxFromProposer && !hasExecutor && !isExpired && (
        <Alert variant="info" className="mt-4">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>
            {isCancellation
              ? 'This on-chain rejection was initiated by a proposer. Please review and approve or dismiss it.'
              : 'This transaction was created by a proposer. Please review and either confirm or reject it.'}
          </AlertDescription>
        </Alert>
      )}

      {isExpired && !hasExecutor && (
        <Alert variant="warning" outlined={false} className="mt-4">
          <AlertSeverityIcon variant="warning" />
          <AlertDescription>This order has expired. Reject this transaction and try again.</AlertDescription>
        </Alert>
      )}
    </AuditLog>
  )
}
