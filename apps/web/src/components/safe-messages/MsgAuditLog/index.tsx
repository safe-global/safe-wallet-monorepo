import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { type ReactElement } from 'react'
import { Alert, Box, Divider, IconButton, Stack, Typography } from '@mui/material'
import CopyIcon from '@mui/icons-material/ContentCopy'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import { AuditRow } from '@/components/common/AuditLog'
import CopyTooltip from '@/components/common/CopyTooltip'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import useOrigin from '@/hooks/useOrigin'
import useAddressBook from '@/hooks/useAddressBook'

const MsgAuditLog = ({ msg }: { msg: MessageItem }): ReactElement => {
  const addressBook = useAddressBook()
  const router = useRouter()
  const { safe = '' } = router.query
  const origin = useOrigin()
  const msgUrl = `${origin}${AppRoutes.transactions.msg}?safe=${safe}&messageHash=${msg.messageHash}`
  const { confirmations, confirmationsRequired, confirmationsSubmitted, proposedBy, creationTimestamp } = msg
  const isConfirmed = msg.status === 'CONFIRMED'

  const resolveName = (address: string | undefined, apiFallback?: string | null): string | undefined =>
    address ? addressBook[address] || apiFallback || undefined : undefined

  const signingLabel = (idx: number) => `Signed (${idx + 1}/${confirmationsRequired})`

  return (
    <Box mb={2} data-testid="msg-audit-log">
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Audit log
        </Typography>
        <TxConfirmations
          submittedConfirmations={confirmationsSubmitted}
          requiredConfirmations={confirmationsRequired}
        />
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CopyTooltip text={msgUrl} initialToolTipText="Copy message link">
            <IconButton size="small" sx={{ color: 'inherit' }}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </CopyTooltip>
        </Box>
      </Stack>
      <Divider sx={{ mb: 1.5 }} />

      <AuditRow
        label="Created"
        actionType="created"
        address={proposedBy.value}
        name={resolveName(proposedBy.value, proposedBy.name)}
        timestamp={creationTimestamp}
        isLast={confirmations.length === 0 && !isConfirmed}
      />

      {confirmations.map(({ owner }, idx) => (
        <AuditRow
          key={owner.value}
          label={signingLabel(idx)}
          actionType="signed"
          address={owner.value}
          name={resolveName(owner.value, owner.name)}
          isLast={idx === confirmations.length - 1 && !isConfirmed}
        />
      ))}

      {isConfirmed && <AuditRow label="Confirmed" actionType="confirmed" timestamp={msg.modifiedTimestamp} isLast />}

      {!isConfirmed && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.75rem' }}>
          Can be confirmed once the threshold is reached.
        </Alert>
      )}
    </Box>
  )
}

export default MsgAuditLog
