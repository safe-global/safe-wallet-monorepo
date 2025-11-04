import type {
  TransactionPreview,
  MultiSend,
  BaseDataDecoded,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { DraftBatchItem } from '@/store/batchSlice'
import BatchTxItem from './BatchTxItem'

import { List } from '@mui/material'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { Operation } from '@safe-global/store/gateway/types'
import { type SafeTransaction } from '@safe-global/types-kit'

const extractMultiSendActions = (txPreview: TransactionPreview | undefined): MultiSend[] => {
  if (!txPreview) {
    return []
  }

  const txData = txPreview.txData
  if (!txData.hexData || !isMultiSendCalldata(txData.hexData)) {
    // Return single transaction (non-MultiSend)
    const baseDataDecoded: BaseDataDecoded | undefined = txData.dataDecoded
      ? {
          method: txData.dataDecoded.method,
          parameters: txData.dataDecoded.parameters ?? undefined,
        }
      : undefined

    return [
      {
        data: txData.hexData ?? '0x',
        operation: Operation.CALL,
        to: txData.to.value,
        value: txData.value ?? '0',
        dataDecoded: baseDataDecoded,
      },
    ]
  }

  const multiSendActions = txData.dataDecoded?.parameters?.[0].valueDecoded
  if (!multiSendActions) {
    return []
  }

  if (!Array.isArray(multiSendActions)) {
    console.error('Expected multiSendActions to be an array, got:', typeof multiSendActions)
    return []
  }

  return multiSendActions
}

const BatchTxList = ({ txItems, onDelete }: { txItems: DraftBatchItem[]; onDelete?: (id: string) => void }) => {
  const [batchSafeTx] = useAsync(() => {
    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = txItems.length > 1
      const tx = isMultiSend
        ? await createMultiSendCallOnlyTx(txItems.map((tx) => tx.txData))
        : await createTx(txItems[0].txData)
      return tx
    }

    return createSafeTx()
  }, [txItems])

  const [decodedBatch] = useTxPreview(batchSafeTx?.data)

  const multiSendActions = extractMultiSendActions(decodedBatch)

  return (
    <>
      <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {txItems.map((item, index) => (
          <BatchTxItem
            key={item.id}
            count={index + 1}
            {...item}
            txDecoded={multiSendActions?.[index]}
            onDelete={onDelete}
            addressInfoIndex={decodedBatch?.txData.addressInfoIndex ?? {}}
            // @ts-ignore
            tokenInfoIndex={decodedBatch?.txData.tokenInfoIndex ?? {}}
          />
        ))}
      </List>
    </>
  )
}

export default BatchTxList
