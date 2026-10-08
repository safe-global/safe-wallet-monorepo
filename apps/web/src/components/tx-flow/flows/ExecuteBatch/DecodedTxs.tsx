import type {
  BaseDataDecoded,
  DataDecoded,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SyntheticEvent } from 'react'
import extractTxInfo from '@/services/tx/extractTxInfo'
import { isCustomTxInfo, isNativeTokenTransfer, isTransferTxInfo } from '@/utils/transaction-guards'
import SingleTxDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded'
import { useState } from 'react'
import { MultisendActionsHeader } from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import { DecodedTxsView } from '@views/components/tx-flow/flows/ExecuteBatch/DecodedTxsView'

const DecodedTxs = ({ txs }: { txs: TransactionDetails[] | undefined }) => {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>()

  if (!txs) return null

  return (
    <DecodedTxsView
      count={txs.length}
      renderHeader={(props) => <MultisendActionsHeader {...props} setOpen={setOpenMap} amount={txs.length} />}
      renderTx={(idx, viewProps) => {
        const transaction = txs[idx]
        if (!transaction.txData) return null

        const onChange = (_: SyntheticEvent, expanded: boolean) => {
          setOpenMap((prev) => ({
            ...prev,
            [idx]: expanded,
          }))
        }

        const { txParams } = extractTxInfo(transaction)

        let decodedDataParams: DataDecoded = {
          method: '',
          parameters: undefined,
        }

        if (isCustomTxInfo(transaction.txInfo) && transaction.txInfo.isCancellation) {
          decodedDataParams.method = 'On-chain rejection'
        }

        if (isTransferTxInfo(transaction.txInfo) && isNativeTokenTransfer(transaction.txInfo.transferInfo)) {
          decodedDataParams.method = 'transfer'
        }

        const dataDecoded = transaction.txData.dataDecoded || decodedDataParams

        return (
          <SingleTxDecoded
            key={transaction.txId}
            tx={{
              dataDecoded: dataDecoded as unknown as BaseDataDecoded,
              data: txParams.data,
              value: txParams.value,
              to: txParams.to,
              operation: 0,
            }}
            txData={transaction.txData}
            {...viewProps}
            expanded={openMap?.[idx] ?? false}
            onChange={onChange}
            isExecuted={!!transaction.executedAt}
          />
        )
      }}
    />
  )
}

export default DecodedTxs
