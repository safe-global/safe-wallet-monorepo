import { memo, type ReactElement } from 'react'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isMultiSendTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import { dateString } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { Receipt } from '@/components/tx/ConfirmTxDetails/Receipt'
import DecodedData from '../TxData/DecodedData'
import ColorCodedTxAccordion from '@/components/tx/ColorCodedTxAccordion'
import { Box, Divider, Typography } from '@mui/material'
import DecoderLinks from './DecoderLinks'
import isEqual from 'lodash/isEqual'
import Multisend from '../TxData/DecodedData/Multisend'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'

interface Props {
  safeTxData?: SafeTransactionData
  txData: TransactionDetails['txData']
  txInfo?: TransactionDetails['txInfo']
  txDetails?: TransactionDetails
  showMultisend?: boolean
}

const Summary = ({ safeTxData, txData, txInfo, txDetails, showMultisend = true }: Props): ReactElement => {
  const { txHash, executedAt } = txDetails ?? {}
  const toInfo = txData?.addressInfoIndex?.[txData?.to.value] || txData?.to
  const showDetails = Boolean(txInfo && txData)

  let baseGas, gasPrice, gasToken, safeTxGas, refundReceiver, submittedAt, nonce
  if (txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    ;({ baseGas, gasPrice, gasToken, safeTxGas, submittedAt, nonce } = txDetails.detailedExecutionInfo)
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

  const isMultisend = (txInfo !== undefined && isMultiSendTxInfo(txInfo)) || isMultiSendCalldata(safeTxData.data)
  const transactionData = txData ?? txDetails?.txData

  return (
    <>
      {showMultisend && isMultisend && <Multisend txData={transactionData} compact />}

      {txHash && (
        <TxDataRow datatestid="tx-hash" title="Transaction hash">
          {generateDataRowValue(txHash, 'hash', true)}{' '}
        </TxDataRow>
      )}

      {submittedAt && (
        <TxDataRow datatestid="tx-created-at" title="Created">
          <Typography variant="body2" component="div">
            {dateString(submittedAt)}
          </Typography>
        </TxDataRow>
      )}

      {executedAt && (
        <TxDataRow datatestid="tx-executed-at" title="Executed">
          <Typography variant="body2" component="div">
            {dateString(executedAt)}
          </Typography>
        </TxDataRow>
      )}

      {showDetails && (
        <Box mt={2}>
          <ColorCodedTxAccordion txInfo={txInfo} txData={txData}>
            <Box my={1}>
              <DecodedData txData={txData} toInfo={toInfo} />
            </Box>

            <Box>
              <Divider sx={{ mx: -2, mt: 2.5 }} />

              <Typography variant="subtitle2" fontWeight={700} mt={2.5} mb={2}>
                Advanced details
              </Typography>

              <DecoderLinks />

              <Receipt safeTxData={safeTxData} txData={txData} txDetails={txDetails} withSignatures grid />
            </Box>
          </ColorCodedTxAccordion>
        </Box>
      )}
    </>
  )
}

export default memo(Summary, isEqual)
