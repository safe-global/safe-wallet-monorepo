import type { TransactionDetails, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement, useState, useCallback, useRef, useEffect } from 'react'
import { Alert, Box, Divider, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DoneIcon from '@mui/icons-material/Done'
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined'
import TxConfirmations from '@/components/transactions/TxConfirmations'

import useWallet from '@/hooks/wallets/useWallet'
import useIsPending from '@/hooks/useIsPending'
import { isCancellationTxInfo, isExecutable, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import CopyIcon from '@/public/images/common/copy.svg'
import LinkIcon from '@/public/images/common/link.svg'

import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import useAddressBook from '@/hooks/useAddressBook'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLinkWrapper from '@/components/transactions/TxShareLink/TxShareLink'
import ExplorerButton from '@/components/common/ExplorerButton'

type ActionType = 'created' | 'signed' | 'executed'

const ACTION_ICONS: Record<ActionType, typeof AddIcon> = {
  created: AddIcon,
  signed: DrawOutlinedIcon,
  executed: DoneIcon,
}

const auditDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const formatAuditDateTime = (ts: number): string => auditDateFormatter.format(new Date(ts))

const WAITING_STATUSES = new Set([
  'Awaiting confirmations',
  'Awaiting execution',
  'Needs your confirmation',
  'Awaiting review',
])
const shortenAuditStatus = (status: string): string => (WAITING_STATUSES.has(status) ? 'Waiting' : status)

type AuditRowProps = {
  label: string
  actionType: ActionType
  address?: string
  name?: string | null
  timestamp?: number | null
  isLast?: boolean
}

const COPIED_TOOLTIP_MS = 750

const AuditRow = ({ label, actionType, address, name, timestamp, isLast }: AuditRowProps): ReactElement => {
  const displayText = address ? name || shortenAddress(address) : undefined
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleCopy = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_TOOLTIP_MS)
    })
  }, [address])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleCopy()
      }
    },
    [handleCopy],
  )

  const ActionIcon = ACTION_ICONS[actionType]

  return (
    <Box className={css.auditRow}>
      {/* Column 1: Timeline icon with vertical connector */}
      <Box className={css.timelineCol}>
        <Box className={css.timelineIcon}>
          <ActionIcon sx={{ fontSize: 14, color: 'primary.main' }} />
        </Box>
        {!isLast && <Box className={css.timelineLine} />}
      </Box>

      {/* Column 2: Action label + actor/origin */}
      <Box className={css.infoCol}>
        <Typography variant="body2" fontWeight={600} lineHeight={1.4}>
          {label}
        </Typography>
        <Box className={css.actorRow}>
          {displayText && address ? (
            <Tooltip title={copied ? 'Copied' : 'Click to copy address'} placement="top">
              <Box className={css.actorCopy} onClick={handleCopy} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
                <Typography variant="caption" color="text.secondary" component="span" className={css.actorText}>
                  {displayText}
                </Typography>
              </Box>
            </Tooltip>
          ) : (
            <Typography variant="caption" color="text.secondary" component="span">
              —
            </Typography>
          )}
        </Box>
      </Box>

      {/* Column 3: Timestamp */}
      <Typography variant="caption" color="text.secondary" className={css.timestamp}>
        {timestamp != null ? formatAuditDateTime(timestamp) : ''}
      </Typography>
    </Box>
  )
}

type TxSignersProps = {
  txDetails: TransactionDetails
  txSummary: Transaction
  isTxFromProposer: boolean
  proposer?: string
}

const TxSigners = ({ txDetails, txSummary, isTxFromProposer, proposer }: TxSignersProps): ReactElement | null => {
  const { detailedExecutionInfo, txInfo, txId } = txDetails
  const isPending = useIsPending(txId)
  const txStatus = useTransactionStatus(txSummary)
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const addressBook = useAddressBook()
  const chain = useCurrentChain()

  if (!detailedExecutionInfo || !isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    return null
  }

  const { confirmations, confirmationsRequired, executor, submittedAt } = detailedExecutionInfo

  const resolveName = (address: string | undefined, apiFallback?: string | null): string | undefined =>
    address ? addressBook[address] || apiFallback || undefined : undefined

  const canExecute = wallet?.address ? isExecutable(txSummary, wallet.address, safe) : false
  const confirmationsNeeded = confirmationsRequired - confirmations.length
  const isConfirmed = confirmationsNeeded <= 0 || canExecute

  const isCancellation = isCancellationTxInfo(txInfo)

  const creationLabel = isTxFromProposer ? 'Proposed' : 'Created'
  const signingLabel = (idx: number) => `Signed (${idx + 1}/${confirmationsRequired})`

  // Use txStatus as fallback for terminal states (FAILED, CANCELLED, AWAITING_EXECUTION, etc.)
  const executionStatus = executor
    ? 'Executed'
    : isPending
      ? txStatus
      : shortenAuditStatus(isTxFromProposer && !isConfirmed ? 'Awaiting review' : txStatus)

  // Only show execution row once threshold reached, tx is terminal, or executor is known
  const showExecutionRow = isConfirmed || !!executor || txDetails.txStatus !== 'AWAITING_CONFIRMATIONS'

  const explorerLink = chain && txDetails.txHash ? getBlockExplorerLink(chain, txDetails.txHash) : undefined

  return (
    <Box mb={2} data-testid="transaction-actions-list">
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Audit log
        </Typography>
        <TxConfirmations submittedConfirmations={confirmations.length} requiredConfirmations={confirmationsRequired} />
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TxShareLinkWrapper id={txDetails.txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
            <Tooltip title="Copy transaction link" placement="top">
              <IconButton size="small" sx={{ color: 'inherit' }}>
                <SvgIcon component={CopyIcon} inheritViewBox fontSize="small" />
              </IconButton>
            </Tooltip>
          </TxShareLinkWrapper>
          {explorerLink ? (
            <ExplorerButton {...explorerLink} isCompact />
          ) : (
            <Tooltip title="Available after execution" placement="top">
              <span>
                <IconButton size="small" disabled>
                  <SvgIcon component={LinkIcon} inheritViewBox fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Creation event — label reflects whether owner or delegate submitted */}
      <AuditRow
        label={creationLabel}
        actionType="created"
        address={proposer}
        name={resolveName(
          proposer,
          detailedExecutionInfo.proposer?.name || detailedExecutionInfo.proposedByDelegate?.name,
        )}
        timestamp={submittedAt}
        isLast={confirmations.length === 0 && !showExecutionRow}
      />

      {/* Individual confirmations */}
      {confirmations.map(({ signer, submittedAt: signedAt }, idx) => (
        <AuditRow
          key={signer.value}
          label={signingLabel(idx)}
          actionType="signed"
          address={signer.value}
          name={resolveName(signer.value, signer.name)}
          timestamp={signedAt}
          isLast={idx === confirmations.length - 1 && !showExecutionRow}
        />
      ))}

      {/* Execution — only shown once threshold reached or tx is in a terminal/executable state */}
      {showExecutionRow && (
        <AuditRow
          label={executionStatus}
          actionType="executed"
          address={executor?.value}
          name={resolveName(executor?.value, executor?.name)}
          timestamp={txDetails.executedAt}
          isLast
        />
      )}

      {/* Footer hint when below threshold */}
      {!isConfirmed && !executor && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.75rem' }}>
          {isCancellation
            ? 'Cancellation can be executed once the required approvals are collected.'
            : 'Can be executed once the threshold is reached.'}
        </Alert>
      )}

      {/* Proposer review hint — only shown while still below threshold */}
      {isTxFromProposer && !executor && !isConfirmed && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.75rem' }}>
          {isCancellation
            ? 'This on-chain rejection was initiated by a proposer. Please review and approve or dismiss it.'
            : 'This transaction was created by a proposer. Please review and either confirm or reject it.'}
        </Alert>
      )}
    </Box>
  )
}

export default TxSigners
