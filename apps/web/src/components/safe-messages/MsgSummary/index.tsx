import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeMessageStatus } from '@safe-global/store/gateway/types'
import { Box, CircularProgress, type Palette, Typography } from '@mui/material'
import type { ReactElement } from 'react'

import DateTime from '@/components/common/DateTime'
import MsgType from '@/components/safe-messages/MsgType'
import SignMsgButton from '@/components/safe-messages/SignMsgButton'
import useSafeMessageStatus from '@/hooks/messages/useSafeMessageStatus'
import TxConfirmations from '@/components/transactions/TxConfirmations'

import css from '@/components/transactions/TxSummary/styles.module.css'
import useIsSafeMessagePending from '@/hooks/messages/useIsSafeMessagePending'
import { isEIP712TypedData } from '@/utils/safe-messages'

const getStatusColor = (value: SafeMessageStatus, palette: Palette): string => {
  switch (value) {
    case 'CONFIRMED':
      return palette.success.main
    case 'NEEDS_CONFIRMATION':
      return palette.warning.main
    default:
      return palette.text.primary
  }
}

const MsgSummary = ({ msg }: { msg: MessageItem }): ReactElement => {
  const { confirmationsSubmitted, confirmationsRequired } = msg
  const txStatusLabel = useSafeMessageStatus(msg)
  const isConfirmed = msg.status === 'CONFIRMED'
  const isPending = useIsSafeMessagePending(msg.messageHash)
  let type = ''
  if (isEIP712TypedData(msg.message)) {
    type = (msg.message as unknown as { primaryType: string }).primaryType
  }

  return (
    <Box className={[css.gridContainer, css.message].join(' ')}>
      <Box gridArea="type">
        <MsgType msg={msg} />
      </Box>

      <Box gridArea="info">{type || 'Signature'}</Box>

      <Box gridArea="date" className={css.date}>
        <DateTime value={msg.modifiedTimestamp} />
      </Box>

      <Box gridArea="confirmations">
        {confirmationsRequired > 0 && (
          <TxConfirmations
            submittedConfirmations={confirmationsSubmitted}
            requiredConfirmations={confirmationsRequired}
          />
        )}
      </Box>

      <Box gridArea="status">
        {isConfirmed || isPending ? (
          <Typography
            variant="caption"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ color: ({ palette }) => getStatusColor(msg.status, palette) }}
          >
            {isPending && <CircularProgress size={14} color="inherit" />}

            {txStatusLabel}
          </Typography>
        ) : (
          <SignMsgButton msg={msg} compact />
        )}
      </Box>
    </Box>
  )
}

export default MsgSummary
