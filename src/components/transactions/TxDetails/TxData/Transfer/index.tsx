import EthHashInfo from '@/components/common/EthHashInfo'
import { TransferTx } from '@/components/transactions/TxInfo'
import { isTxQueued } from '@/utils/transaction-guards'
import type { TransactionStatus, Transfer } from '@safe-global/safe-gateway-typescript-sdk'
import { TransferDirection } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, SvgIcon, Tooltip, Typography } from '@mui/material'
import React from 'react'

import TransferActions from '@/components/transactions/TxDetails/TxData/Transfer/TransferActions'
import WarningIcon from '@/public/images/notifications/warning.svg'

type TransferTxInfoProps = {
  txInfo: Transfer
  txStatus: TransactionStatus
}

const TransferTxInfoSummary = ({ txInfo, txStatus, trusted }: TransferTxInfoProps & { trusted: boolean }) => {
  const { direction } = txInfo

  return (
    <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
      <Typography>
        {direction === TransferDirection.INCOMING ? 'Received' : isTxQueued(txStatus) ? 'Send' : 'Sent'}{' '}
        <b>
          <TransferTx info={txInfo} withLogo={false} omitSign />
        </b>
        {direction === TransferDirection.INCOMING ? ' from:' : ' to:'}
      </Typography>
      {!trusted && (
        <Tooltip
          title={`This token is unfamiliar and may pose risks when interacting with it or the address that ${
            direction === TransferDirection.INCOMING ? 'sent' : 'received'
          } it.`}
        >
          <Box lineHeight="16px">
            <SvgIcon component={WarningIcon} fontSize="small" inheritViewBox color="warning" />
          </Box>
        </Tooltip>
      )}
    </Box>
  )
}

const TransferTxInfo = ({ txInfo, txStatus, trusted }: TransferTxInfoProps & { trusted: boolean }) => {
  const address = txInfo.direction.toUpperCase() === TransferDirection.INCOMING ? txInfo.sender : txInfo.recipient

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <TransferTxInfoSummary txInfo={txInfo} txStatus={txStatus} trusted={trusted} />

      <Box display="flex" alignItems="center">
        <EthHashInfo
          address={address.value}
          name={address.name}
          customAvatar={address.logoUri}
          shortAddress={false}
          hasExplorer
          showCopyButton
          trusted={trusted}
        >
          <TransferActions address={address.value} txInfo={txInfo} />
        </EthHashInfo>
      </Box>
    </Box>
  )
}

export default TransferTxInfo
