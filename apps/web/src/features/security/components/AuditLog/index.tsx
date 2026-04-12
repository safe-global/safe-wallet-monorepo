import { type ReactElement, type ReactNode, useMemo } from 'react'
import { Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import Link from 'next/link'
import type {
  SettingsChangeTransaction,
  MultisigExecutionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isSettingsChangeTxInfo } from '@/utils/transaction-guards'
import { useCurrentChain } from '@/hooks/useChains'
import { getTxLink } from '@/utils/tx-link'
import EnhancedTable from '@/components/common/EnhancedTable'
import EthHashInfo from '@/components/common/EthHashInfo'
import { getSettingsMeta } from './utils'
import useAuditLog, { type AuditLogEntry } from './useAuditLog'

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'Executed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  AWAITING_CONFIRMATIONS: 'Pending',
  AWAITING_EXECUTION: 'Ready',
}

const STATUS_TEXT_COLORS: Record<string, string> = {
  FAILED: 'error.main',
  AWAITING_CONFIRMATIONS: 'warning.main',
  AWAITING_EXECUTION: 'warning.main',
}

const HEAD_CELLS = [
  { id: 'timestamp', label: 'Timestamp', width: '15%' },
  { id: 'nonce', label: 'Nonce', width: '8%' },
  { id: 'event', label: 'Event', width: '28%' },
  { id: 'source', label: 'Source', width: '12%', disableSort: true },
  { id: 'signatures', label: 'Signatures', width: '10%', disableSort: true },
  { id: 'status', label: 'Status', width: '10%' },
  { id: 'actions', label: '', width: '17%', disableSort: true, sticky: true },
]

const formatTimestamp = (ts: number): string =>
  new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const formatTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

const renderAddress = (address: string, name?: string | null): ReactNode => (
  <EthHashInfo address={address} name={name ?? undefined} shortAddress showAvatar={false} />
)

const renderSettingsDescription = (txInfo: SettingsChangeTransaction): ReactNode => {
  if (txInfo.humanDescription) {
    const cleaned = txInfo.humanDescription.replace(/\s*with threshold \d+/i, '')
    return (
      <Typography variant="caption" color="text.secondary" display="block">
        {cleaned}
      </Typography>
    )
  }

  const { settingsInfo } = txInfo

  switch (settingsInfo.type) {
    case 'ADD_OWNER':
      return (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          {renderAddress(settingsInfo.owner.value, settingsInfo.owner.name)}
          <Typography variant="caption" color="text.secondary">
            · threshold → {settingsInfo.threshold}
          </Typography>
        </Stack>
      )
    case 'REMOVE_OWNER':
      return (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          {renderAddress(settingsInfo.owner.value, settingsInfo.owner.name)}
          <Typography variant="caption" color="text.secondary">
            · threshold → {settingsInfo.threshold}
          </Typography>
        </Stack>
      )
    case 'SWAP_OWNER':
      return (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          {renderAddress(settingsInfo.oldOwner.value, settingsInfo.oldOwner.name)}
          <Typography variant="caption" color="text.secondary">
            →
          </Typography>
          {renderAddress(settingsInfo.newOwner.value, settingsInfo.newOwner.name)}
        </Stack>
      )
    case 'CHANGE_THRESHOLD':
      return (
        <Typography variant="caption" color="text.secondary" display="block">
          Set to {settingsInfo.threshold}
        </Typography>
      )
    case 'CHANGE_MASTER_COPY':
      return renderAddress(settingsInfo.implementation.value, settingsInfo.implementation.name)
    case 'ENABLE_MODULE':
      return renderAddress(settingsInfo.module.value, settingsInfo.module.name)
    case 'DISABLE_MODULE':
      return renderAddress(settingsInfo.module.value, settingsInfo.module.name)
    case 'SET_GUARD':
      return renderAddress(settingsInfo.guard.value, settingsInfo.guard.name)
    case 'SET_FALLBACK_HANDLER':
      return renderAddress(settingsInfo.handler.value, settingsInfo.handler.name)
    case 'DELETE_GUARD':
    default:
      return null
  }
}

type TxLinkFn = ReturnType<typeof getTxLink> extends infer R ? (txId: string) => R : never

const entryToRow = (entry: AuditLogEntry, getTxDetailLink?: TxLinkFn) => {
  const { transaction } = entry
  if (!isSettingsChangeTxInfo(transaction.txInfo)) return null

  const txInfo = transaction.txInfo
  const meta = getSettingsMeta(txInfo.settingsInfo.type)
  const description = renderSettingsDescription(txInfo)

  const isMultisig = transaction.executionInfo?.type === 'MULTISIG'
  const multisigInfo = isMultisig ? (transaction.executionInfo as MultisigExecutionInfo) : null

  const txDetailLink = getTxDetailLink?.(transaction.id)
  const statusColor = STATUS_TEXT_COLORS[transaction.txStatus] ?? 'text.secondary'

  return {
    key: entry.id,
    cells: {
      timestamp: {
        rawValue: transaction.timestamp,
        mobileLabel: 'Timestamp',
        content: (
          <Box>
            <Typography variant="body2">{formatTimestamp(transaction.timestamp)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(transaction.timestamp)}
            </Typography>
          </Box>
        ),
      },
      nonce: {
        rawValue: multisigInfo ? multisigInfo.nonce : null,
        mobileLabel: 'Nonce',
        content: multisigInfo ? (
          <Typography variant="body2">{multisigInfo.nonce}</Typography>
        ) : transaction.executionInfo?.type === 'MODULE' ? (
          <Typography variant="body2" color="text.secondary">
            Module
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
      },
      event: {
        rawValue: meta.label,
        mobileLabel: 'Event',
        content: (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                {meta.label}
              </Typography>
              {entry.warnings.map((w) => (
                <Chip
                  key={w.label}
                  label={w.label}
                  size="small"
                  color={w.severity === 'error' ? 'error' : 'warning'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              ))}
            </Stack>
            {description && <Box sx={{ mt: 0.5 }}>{description}</Box>}
            {transaction.note && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5} fontStyle="italic">
                {transaction.note}
              </Typography>
            )}
          </Box>
        ),
      },
      source: {
        rawValue: transaction.safeAppInfo?.name ?? null,
        mobileLabel: 'Source',
        content: (
          <Typography variant="body2" color="text.secondary">
            {transaction.safeAppInfo?.name ?? 'Safe Wallet'}
          </Typography>
        ),
      },
      signatures: {
        rawValue: multisigInfo ? multisigInfo.confirmationsSubmitted : null,
        mobileLabel: 'Signatures',
        content: multisigInfo ? (
          <Typography variant="body2" color="text.secondary">
            {multisigInfo.confirmationsSubmitted} of {multisigInfo.confirmationsRequired}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
      },
      status: {
        rawValue: transaction.txStatus,
        mobileLabel: 'Status',
        content: (
          <Typography variant="body2" color={statusColor}>
            {STATUS_LABELS[transaction.txStatus] ?? transaction.txStatus.toLowerCase()}
          </Typography>
        ),
      },
      actions: {
        rawValue: null,
        sticky: true,
        content: txDetailLink ? (
          <Link href={txDetailLink.href} passHref legacyBehavior>
            <Button component="a" variant="text" size="small" startIcon={<VisibilityRoundedIcon />}>
              View transaction
            </Button>
          </Link>
        ) : null,
      },
    },
  }
}

type AuditLogProps = {
  chainId: string
  safeAddress: string
}

const AuditLog = ({ chainId, safeAddress }: AuditLogProps): ReactElement => {
  const { entries, isLoading, error, hasMore } = useAuditLog(chainId, safeAddress)
  const chain = useCurrentChain()

  const getTxDetailLink = useMemo(() => {
    if (!chain) return undefined
    return (txId: string) => getTxLink(txId, chain, safeAddress)
  }, [chain, safeAddress])

  const rows = useMemo(
    () =>
      entries.map((e) => entryToRow(e, getTxDetailLink)).filter((row): row is NonNullable<typeof row> => row !== null),
    [entries, getTxDetailLink],
  )

  if (isLoading && entries.length === 0) {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: '8px' }} />
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="error.main">
          {error}
        </Typography>
      </Box>
    )
  }

  if (!isLoading && rows.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" mb={1}>
          No account configuration changes found
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Changes to signers, threshold, modules, and guards will appear here.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <EnhancedTable rows={rows} headCells={HEAD_CELLS} mobileVariant />
      {hasMore && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          Showing the most recent {entries.length} changes. Older entries are not displayed.
        </Typography>
      )}
    </>
  )
}

export default AuditLog
