import type { TransactionDetails, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement, useState, useCallback, useRef, useEffect } from 'react'
import { Alert, Box, Divider, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DoneIcon from '@mui/icons-material/Done'
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined'
import CopyIcon from '@mui/icons-material/ContentCopy'
import TxConfirmations from '@/components/transactions/TxConfirmations'

import useWallet from '@/hooks/wallets/useWallet'
import useIsPending from '@/hooks/useIsPending'
import {
  isCancellationTxInfo,
  isExecutable,
  isModuleDetailedExecutionInfo,
  isMultisigDetailedExecutionInfo,
} from '@/utils/transaction-guards'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import ExplorerFallbackIcon from '@/public/images/common/link.svg'

import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import useAddressBook from '@/hooks/useAddressBook'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLinkWrapper from '@/components/transactions/TxShareLink/TxShareLink'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useAsync from '@safe-global/utils/hooks/useAsync'

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

const useCopyToClipboard = (text?: string | null): [boolean, () => void] => {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleCopy = useCallback(() => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_TOOLTIP_MS)
    })
  }, [text])

  return [copied, handleCopy]
}

const AuditRow = ({ label, actionType, address, name, timestamp, isLast }: AuditRowProps): ReactElement => {
  const displayText = address ? name || shortenAddress(address) : undefined
  const [copied, handleCopy] = useCopyToClipboard(address)

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
                  By {displayText}
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

const AuditLogHeader = ({
  children,
  txId,
  explorerLink,
}: {
  children?: ReactElement
  txId: string
  explorerLink?: { title: string; href: string }
}) => (
  <>
    <Stack direction="row" alignItems="center" gap={1} mb={1}>
      <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Audit log
      </Typography>
      {children}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TxShareLinkWrapper id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
          <Tooltip title="Copy transaction link" placement="top">
            <IconButton size="small" sx={{ color: 'inherit' }}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TxShareLinkWrapper>
        {explorerLink ? (
          <ExplorerButton {...explorerLink} isCompact />
        ) : (
          <Tooltip title="Available after execution" placement="top">
            <span>
              <IconButton size="small" disabled>
                <SvgIcon component={ExplorerFallbackIcon} inheritViewBox fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Stack>
    <Divider sx={{ mb: 1.5 }} />
  </>
)

const TxSigners = ({ txDetails, txSummary, isTxFromProposer, proposer }: TxSignersProps): ReactElement | null => {
  const { detailedExecutionInfo, txInfo, txId } = txDetails
  const isPending = useIsPending(txId)
  const txStatus = useTransactionStatus(txSummary)
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const addressBook = useAddressBook()
  const chain = useCurrentChain()

  const isMultisig = isMultisigDetailedExecutionInfo(detailedExecutionInfo)
  const isModule = isModuleDetailedExecutionInfo(detailedExecutionInfo)

  // Lookup the EOA that submitted the transaction on-chain (for module and incoming txs)
  const readOnlyProvider = useWeb3ReadOnly()
  const [onChainFrom] = useAsync(async () => {
    if (isMultisig || !txDetails.txHash || !readOnlyProvider) return undefined
    const tx = await readOnlyProvider.getTransaction(txDetails.txHash)
    return tx?.from
  }, [isMultisig, txDetails.txHash, readOnlyProvider])

  const explorerLink = chain && txDetails.txHash ? getBlockExplorerLink(chain, txDetails.txHash) : undefined

  const resolveName = (address: string | undefined, apiFallback?: string | null): string | undefined =>
    address ? addressBook[address] || apiFallback || undefined : undefined

  if (!isMultisig && !isModule) {
    if (!txDetails.executedAt) return null

    return (
      <Box mb={2} data-testid="transaction-actions-list">
        <AuditLogHeader txId={txId} explorerLink={explorerLink} />
        <AuditRow
          label="Executed"
          actionType="executed"
          address={onChainFrom}
          name={resolveName(onChainFrom)}
          timestamp={txDetails.executedAt}
          isLast
        />
      </Box>
    )
  }

  // Module-executed transaction: Created (initiator EOA) + Executed (module)
  if (isModule && detailedExecutionInfo) {
    const moduleAddress = detailedExecutionInfo.address.value
    // "AllowanceModule" → "Allowance Module"
    const moduleName = detailedExecutionInfo.address.name?.replace(/([a-z])([A-Z])/g, '$1 $2')

    return (
      <Box mb={2} data-testid="transaction-actions-list">
        <AuditLogHeader txId={txId} explorerLink={explorerLink} />

        <AuditRow
          label="Created"
          actionType="created"
          address={onChainFrom}
          name={resolveName(onChainFrom)}
          timestamp={txDetails.executedAt}
        />

        <AuditRow
          label="Executed"
          actionType="executed"
          address={moduleAddress}
          name={resolveName(moduleAddress, moduleName)}
          timestamp={txDetails.executedAt}
          isLast
        />
      </Box>
    )
  }

  // Multisig transaction: full audit log with confirmations
  // At this point isMultisig is true and both !isMultisig and isModule branches have returned
  const multisigInfo = detailedExecutionInfo!
  const { confirmations, confirmationsRequired, executor, submittedAt } = multisigInfo

  const canExecute = wallet?.address ? isExecutable(txSummary, wallet.address, safe) : false
  const confirmationsNeeded = confirmationsRequired - confirmations.length
  const isConfirmed = confirmationsNeeded <= 0 || canExecute

  const isCancellation = isCancellationTxInfo(txInfo)

  const creationLabel = isTxFromProposer ? 'Proposed' : 'Created'
  const signingLabel = (idx: number) => `Signed (${idx + 1}/${confirmationsRequired})`

  const executionStatus = executor
    ? 'Executed'
    : isPending
      ? txStatus
      : shortenAuditStatus(isTxFromProposer && !isConfirmed ? 'Awaiting review' : txStatus)

  const showExecutionRow = isConfirmed || !!executor || txDetails.txStatus !== 'AWAITING_CONFIRMATIONS'

  return (
    <Box mb={2} data-testid="transaction-actions-list">
      <AuditLogHeader txId={txId} explorerLink={explorerLink}>
        <TxConfirmations submittedConfirmations={confirmations.length} requiredConfirmations={confirmationsRequired} />
      </AuditLogHeader>

      <AuditRow
        label={creationLabel}
        actionType="created"
        address={proposer}
        name={resolveName(proposer, multisigInfo.proposer?.name || multisigInfo.proposedByDelegate?.name)}
        timestamp={submittedAt}
        isLast={confirmations.length === 0 && !showExecutionRow}
      />

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

      {confirmationsNeeded > 0 && !executor && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.75rem' }}>
          {isCancellation
            ? 'Cancellation can be executed once the required approvals are collected.'
            : 'Can be executed once the threshold is reached.'}
        </Alert>
      )}

      {isTxFromProposer && !executor && (
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
