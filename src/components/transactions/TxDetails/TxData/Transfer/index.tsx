import EthHashInfo from '@/components/common/EthHashInfo'
import { TransferTx } from '@/components/transactions/TxInfo'
import { isTxQueued } from '@/utils/transaction-guards'
import type { TransactionStatus, Transfer } from '@safe-global/safe-gateway-typescript-sdk'
import { TransferDirection } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, Typography } from '@mui/material'
import React from 'react'

import TransferActions from '@/components/transactions/TxDetails/TxData/Transfer/TransferActions'
import UntrustedTxWarning from '@/components/transactions/UntrustedTxWarning'
import { ImitationTransactionWarning } from '@/components/transactions/ImitationTransactionWarning'

type TransferTxInfoProps = {
  txInfo: Transfer
  txStatus: TransactionStatus
  trusted: boolean
  imitation: boolean
}

const TransferTxInfoSummary = ({ txInfo, txStatus, trusted, imitation }: TransferTxInfoProps) => {
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
      {!trusted && !imitation && <UntrustedTxWarning />}
    </Box>
  )
}

const TransferTxInfo = ({ txInfo, txStatus, trusted, imitation }: TransferTxInfoProps & { trusted: boolean }) => {
  const address = txInfo.direction.toUpperCase() === TransferDirection.INCOMING ? txInfo.sender : txInfo.recipient

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <TransferTxInfoSummary txInfo={txInfo} txStatus={txStatus} trusted={trusted} imitation={imitation} />

      <Box display="flex" alignItems="center" width="100%">
        <EthHashInfo
          address={address.value}
          name={address.name}
          customAvatar={address.logoUri}
          shortAddress={false}
          hasExplorer
          showCopyButton
          trusted={trusted}
        >
          <TransferActions address={address.value} txInfo={txInfo} trusted={trusted} />
        </EthHashInfo>
      </Box>
      {imitation && <ImitationTransactionWarning />}
    </Box>
  )
}

export default TransferTxInfo
