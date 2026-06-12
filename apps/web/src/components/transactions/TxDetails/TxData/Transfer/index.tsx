import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransferDirection } from '@safe-global/store/gateway/types'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { TransferTx } from '@/components/transactions/TxInfo'
import { isTxQueued } from '@/utils/transaction-guards'
import { Typography } from '@/components/ui/typography'
import React from 'react'

import TransferActions from '@/components/transactions/TxDetails/TxData/Transfer/TransferActions'
import MaliciousTxWarning from '@/components/transactions/MaliciousTxWarning'
import { ImitationTransactionWarning } from '@/components/transactions/ImitationTransactionWarning'
import TokenAmount from '@/components/common/TokenAmount'
import { type NativeToken, type Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import FiatValue from '@/components/common/FiatValue'
import useTransferFiatValue from './useTransferFiatValue'

type TransferTxInfoProps = {
  txInfo: TransferTransactionInfo
  txStatus: Transaction['txStatus']
  trusted: boolean
  imitation: boolean
}

const TransferTxInfoMain = ({ txInfo, txStatus, trusted, imitation }: TransferTxInfoProps) => {
  const { direction } = txInfo
  const isQueued = isTxQueued(txStatus)
  const fiatValue = useTransferFiatValue(txInfo.transferInfo, isQueued)

  return (
    <div className="flex flex-row items-center gap-2">
      {direction === TransferDirection.INCOMING ? 'Received' : isQueued ? 'Send' : 'Sent'}{' '}
      <b>
        <TransferTx info={txInfo} omitSign preciseAmount />
      </b>
      {fiatValue != null && (
        <Typography variant="paragraph-small" className="text-muted-foreground">
          (<FiatValue value={fiatValue} />)
        </Typography>
      )}
      {direction === TransferDirection.INCOMING ? ' from' : ' to'}
      {!trusted && !imitation && <MaliciousTxWarning />}
    </div>
  )
}

const TransferTxInfo = ({ txInfo, txStatus, trusted, imitation }: TransferTxInfoProps) => {
  const address = txInfo.direction.toUpperCase() === TransferDirection.INCOMING ? txInfo.sender : txInfo.recipient

  return (
    <div className="flex flex-col gap-2">
      <TransferTxInfoMain txInfo={txInfo} txStatus={txStatus} trusted={trusted} imitation={imitation} />

      <div className="flex w-full items-center">
        <NamedAddressInfo
          address={address.value}
          name={address.name}
          customAvatar={address.logoUri}
          shortAddress={false}
          hasExplorer
          showCopyButton
          trusted={trusted && !imitation}
        >
          <TransferActions address={address.value} txInfo={txInfo} trusted={trusted} />
        </NamedAddressInfo>
      </div>
      {imitation && <ImitationTransactionWarning />}
    </div>
  )
}

export const InlineTransferTxInfo = ({
  value,
  tokenInfo,
  recipient,
}: {
  value: string
  tokenInfo: Erc20Token | NativeToken
  recipient: string
}) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <Typography>Send</Typography>
      <TokenAmount
        value={value}
        decimals={tokenInfo.decimals}
        logoUri={tokenInfo.logoUri}
        tokenSymbol={tokenInfo.symbol}
        iconSize={16}
      />
      <Typography>to</Typography>
      <NamedAddressInfo address={recipient} copyAddress={false} shortAddress={true} onlyName avatarSize={16} />
    </div>
  )
}

export default TransferTxInfo
