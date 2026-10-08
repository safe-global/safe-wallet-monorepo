import type { MultiSend, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SyntheticEvent } from 'react'
import { isEmptyHexData } from '@/utils/hex'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeToL2MigrationDeployment } from '@safe-global/safe-deployments'
import { useCurrentChain } from '@/hooks/useChains'
import { type TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { InlineTransferTxInfo } from '../../Transfer'
import { useTransferTokenInfo } from './useTransferTokenInfo'
import { SingleTxDecodedView } from '@views/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded/SingleTxDecodedView'

type OnAccordionChange = (event: SyntheticEvent, expanded: boolean) => void

type SingleTxDecodedProps = {
  tx: MultiSend
  txData: TransactionData
  actionTitle: string
  variant?: 'elevation' | 'outlined'
  // Pass 'none' when stacking rows in a divided list, so their corners stay flush.
  radius?: 'lg' | 'xl' | 'none'
  expanded?: boolean
  onChange?: OnAccordionChange
  isExecuted?: boolean
  actions?: React.ReactNode
}

const SingleTxDecoded = ({
  tx,
  txData,
  actionTitle,
  variant,
  radius,
  expanded,
  onChange,
  isExecuted = false,
  actions,
}: SingleTxDecodedProps) => {
  const chain = useCurrentChain()
  const isNativeTransfer = tx.value !== '0' && (!tx.data || isEmptyHexData(tx.data))

  const addressInfo = txData.addressInfoIndex?.[tx.to]
  const name = addressInfo?.name

  const safeToL2MigrationDeployment = getSafeToL2MigrationDeployment()
  const safeToL2MigrationAddress = chain && safeToL2MigrationDeployment?.networkAddresses[chain.chainId]
  const tokenInfoIndex = (txData as TransactionDetails['txData'])?.tokenInfoIndex

  const txDataHex = tx.data ?? '0x'

  const transferTokenInfo = useTransferTokenInfo(txDataHex, tx.value, tx.to, tokenInfoIndex)

  const singleTxData = {
    to: { value: tx.to },
    value: tx.value,
    operation: tx.operation,
    dataDecoded: tx.dataDecoded,
    hexData: tx.data ?? undefined,
    addressInfoIndex: txData.addressInfoIndex,
    trustedDelegateCallTarget: sameAddress(tx.to, safeToL2MigrationAddress),
  }

  return (
    <SingleTxDecodedView
      actionTitle={actionTitle}
      variant={variant}
      radius={radius}
      expanded={expanded}
      onChange={onChange}
      actions={actions}
      name={name}
      methodName={tx.dataDecoded?.method}
      isNativeTransfer={isNativeTransfer}
      transferInfo={
        transferTokenInfo && (
          <InlineTransferTxInfo
            value={transferTokenInfo.transferValue}
            tokenInfo={transferTokenInfo.tokenInfo}
            recipient={transferTokenInfo.recipient}
          />
        )
      }
      decodedData={<DecodedData txData={singleTxData} toInfo={{ value: tx.to }} isTxExecuted={isExecuted} />}
    />
  )
}

export default SingleTxDecoded
