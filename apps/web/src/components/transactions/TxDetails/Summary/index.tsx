import type { ReactElement } from 'react'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCustomTxInfo, isMultiSendTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import { dateString } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TxDetails } from '@/components/tx/ConfirmTxDetails/TxDetails'
import DecodedData from '../TxData/DecodedData'
import ColorCodedTxAccordion from '@/components/tx/ColorCodedTxAccordion'
import { Box, Divider } from '@mui/material'
import DecoderLinks from './DecoderLinks'

interface Props {
  safeTxData?: SafeTransactionData
  txData: TransactionDetails['txData']
  txInfo?: TransactionDetails['txInfo']
  txDetails?: TransactionDetails
}

const Summary = ({ safeTxData, txData, txInfo, txDetails }: Props): ReactElement => {
  const { txHash, executedAt } = txDetails ?? {}
  const toInfo = txData?.addressInfoIndex?.[txData?.to.value] || txData?.to
  const isExpanded = txInfo && isCustomTxInfo(txInfo) && !isMultiSendTxInfo(txInfo)

  let baseGas, gasPrice, gasToken, safeTxGas, refundReceiver, submittedAt, nonce
  if (txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    ;({ baseGas, gasPrice, gasToken, safeTxGas, nonce } = txDetails.detailedExecutionInfo)
    refundReceiver = txDetails.detailedExecutionInfo.refundReceiver?.value
  }

  safeTxData = safeTxData ?? {
    to: txData?.to.value ?? ZERO_ADDRESS,
    data: txData?.hexData ?? '0x',
    value: txData?.value ?? BigInt(0).toString(),
    operation: (txData?.operation as number) ?? 0,
    baseGas: baseGas ?? BigInt(0).toString(),
    gasPrice: gasPrice ?? BigInt(0).toString(),
    gasToken: gasToken ?? ZERO_ADDRESS,
    nonce: nonce ?? 0,
    refundReceiver: refundReceiver ?? ZERO_ADDRESS,
    safeTxGas: safeTxGas ?? BigInt(0).toString(),
  }

  return (
    <>
      {txHash && (
        <TxDataRow datatestid="tx-hash" title="Transaction hash:">
          {generateDataRowValue(txHash, 'hash', true)}{' '}
        </TxDataRow>
      )}

      <TxDataRow datatestid="tx-created-at" title="Created:">
        {submittedAt ? dateString(submittedAt) : null}
      </TxDataRow>

      {executedAt && (
        <TxDataRow datatestid="tx-executed-at" title="Executed:">
          {dateString(executedAt)}
        </TxDataRow>
      )}

      <Box mt={3}>
        <ColorCodedTxAccordion txInfo={txInfo} txData={txData} defaultExpanded={isExpanded}>
          <DecodedData txData={txData} toInfo={toInfo} />

          <DecoderLinks />

          <Box mx={-2}>
            <Divider sx={{ mx: -1 }} />

            <TxDetails safeTxData={safeTxData} txData={txData} grid />
          </Box>
        </ColorCodedTxAccordion>
      </Box>
    </>
  )
}

export default Summary
