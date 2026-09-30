import type {
  BaseDataDecoded,
  DataDecoded,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SyntheticEvent } from 'react'
import extractTxInfo from '@/services/tx/extractTxInfo'
import { isCustomTxInfo, isNativeTokenTransfer, isTransferTxInfo } from '@/utils/transaction-guards'
import SingleTxDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { MultisendActionsHeader } from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'

const DecodedTxs = ({ txs }: { txs: TransactionDetails[] | undefined }) => {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>()

  if (!txs) return null

  return (
    <>
      <MultisendActionsHeader title="Batched transactions" setOpen={setOpenMap} amount={txs.length} compact />

      <Card variant="muted" size="none" className="mt-2">
        <CardContent>
          {/* Padding outside, clipping inside: the action rows are white on this card's grey, so
              without a rounded clip their square corners sat inside its 16px curve. 8px = the card's
              16px less the 8px inset, which keeps the two concentric. */}
          <div className="p-2">
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-sm">
              {txs.map((transaction, idx) => {
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
                    actionTitle={`${idx + 1}`}
                    variant="outlined"
                    expanded={openMap?.[idx] ?? false}
                    onChange={onChange}
                    isExecuted={!!transaction.executedAt}
                  />
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default DecodedTxs
