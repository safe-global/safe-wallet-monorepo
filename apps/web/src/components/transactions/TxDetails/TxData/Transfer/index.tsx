import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransferDirection } from '@safe-global/store/gateway/types'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { TransferTx } from '@/components/transactions/TxInfo'
import { isTxQueued } from '@/utils/transaction-guards'
import React from 'react'

import TransferActions from '@/components/transactions/TxDetails/TxData/Transfer/TransferActions'
import { type NativeToken, type Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import FiatValue from '@/components/common/FiatValue'
import useTransferFiatValue from './useTransferFiatValue'
import {
  InlineTransferTxInfoView,
  TransferTxInfoMainView,
  TransferTxInfoView,
} from '@views/components/transactions/TxDetails/TxData/Transfer/TransferView'

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
    <TransferTxInfoMainView
      isIncoming={direction === TransferDirection.INCOMING}
      isQueued={isQueued}
      transferTx={<TransferTx info={txInfo} omitSign preciseAmount iconSize={32} />}
      fiatValue={fiatValue != null ? <FiatValue value={fiatValue} /> : undefined}
      showMaliciousWarning={!trusted && !imitation}
    />
  )
}

const TransferTxInfo = ({ txInfo, txStatus, trusted, imitation }: TransferTxInfoProps) => {
  const { direction } = txInfo
  const address = direction.toUpperCase() === TransferDirection.INCOMING ? txInfo.sender : txInfo.recipient

  return (
    <TransferTxInfoView
      main={<TransferTxInfoMain txInfo={txInfo} txStatus={txStatus} trusted={trusted} imitation={imitation} />}
      isIncoming={direction === TransferDirection.INCOMING}
      address={
        <NamedAddressInfo
          address={address.value}
          name={address.name}
          customAvatar={address.logoUri}
          shortAddress={false}
          hasExplorer
          showCopyButton
          showPrefix={false}
          avatarSize={32}
          trusted={trusted && !imitation}
        >
          <TransferActions address={address.value} txInfo={txInfo} trusted={trusted} />
        </NamedAddressInfo>
      }
      imitation={imitation}
    />
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
    <InlineTransferTxInfoView
      value={value}
      tokenInfo={tokenInfo}
      recipient={
        <NamedAddressInfo address={recipient} copyAddress={false} shortAddress={true} onlyName avatarSize={16} />
      }
    />
  )
}

export default TransferTxInfo
