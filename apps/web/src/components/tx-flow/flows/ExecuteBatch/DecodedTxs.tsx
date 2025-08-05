import type { DataDecoded, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Box } from '@mui/material'
import extractTxInfo from '@/services/tx/extractTxInfo'
import { isCustomTxInfo, isNativeTokenTransfer, isTransferTxInfo } from '@/utils/transaction-guards'
import SingleTxDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded'
import css from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend/styles.module.css'
import { useState } from 'react'
import { MultisendActionsHeader } from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import { type AccordionProps } from '@mui/material/Accordion/Accordion'

const DecodedTxs = ({ txs }: { txs: TransactionDetails[] | undefined }) => {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>()

  if (!txs) return null

  return (
    <>
      <MultisendActionsHeader title="Batched transactions" setOpen={setOpenMap} amount={txs.length} compact />

      <Box className={css.compact}>
        {txs.map((transaction, idx) => {
          if (!transaction.txData) return null

          const onChange: AccordionProps['onChange'] = (_, expanded) => {
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
                dataDecoded,
                data: txParams.data,
                value: txParams.value,
                to: txParams.to,
                operation: 0,
              }}
              txData={transaction.txData}
              actionTitle={`${idx + 1}`}
              expanded={openMap?.[idx] ?? false}
              onChange={onChange}
              isExecuted={!!transaction.executedAt}
            />
          )
        })}
      </Box>
    </>
  )
}

export default DecodedTxs
