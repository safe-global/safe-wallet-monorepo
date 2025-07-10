import React from 'react'
import { SafeListItem } from '@/src/components/SafeListItem'
import { isERC721Transfer, isOutgoingTransfer, isTxQueued } from '@/src/utils/transaction-guards'
import { TransferDirection } from '@safe-global/store/gateway/types'
import { TransferTransactionInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenIcon } from '@/src/components/TokenIcon'
import { useTokenDetails } from '@/src/hooks/useTokenDetails'
import { TokenAmount } from '@/src/components/TokenAmount'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxTokenCardProps = {
  txStatus: Transaction['txStatus']
  txInfo: TransferTransactionInfo
} & Partial<SafeListItemProps>

export function TxTokenCard({ inQueue, txStatus, txInfo, ...rest }: TxTokenCardProps) {
  const isSendTx = isOutgoingTransfer(txInfo)
  const icon = isSendTx ? 'transaction-outgoing' : 'transaction-incoming'
  const type = isSendTx ? (isTxQueued(txStatus) ? 'Send' : 'Sent') : 'Received'
  const { logoUri, name, value, tokenSymbol, decimals } = useTokenDetails(txInfo)
  const isERC721 = isERC721Transfer(txInfo.transferInfo)
  const isOutgoing = txInfo.direction === TransferDirection.OUTGOING

  return (
    <SafeListItem
      inQueue={inQueue}
      label={inQueue ? <TokenAmount value={value} decimals={decimals} tokenSymbol={tokenSymbol} preciseAmount /> : name}
      icon={icon}
      type={type}
      leftNode={<TokenIcon logoUri={logoUri} accessibilityLabel={name} />}
      rightNode={
        <TokenAmount
          value={value}
          decimals={decimals}
          tokenSymbol={!isERC721 ? tokenSymbol : ''}
          direction={txInfo.direction}
          preciseAmount
          displayPositiveSign
          textProps={{ color: isOutgoing ? '$color' : '$primary', textAlign: 'right', fontWeight: 400 }}
        />
      }
      {...rest}
    />
  )
}
