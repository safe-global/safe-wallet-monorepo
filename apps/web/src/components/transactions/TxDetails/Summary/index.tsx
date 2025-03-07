import { type ReactElement, useState } from 'react'
import { Link, Stack, Box, Typography } from '@mui/material'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCustomTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import { dateString } from '@/utils/formatters'
import css from './styles.module.css'
import DecodedData from '../TxData/DecodedData'
import { SafeTxHashDataRow } from './SafeTxHashDataRow'
import { Divider } from '@/components/tx/DecodedTx'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

interface Props {
  safeTxData?: SafeTransactionData
  txData: TransactionDetails['txData']
  txInfo?: TransactionDetails['txInfo']
  txDetails?: TransactionDetails
  isTxDetailsPreview?: boolean
  hideDecodedData?: boolean
}

const Summary = ({
  safeTxData,
  txData,
  txInfo,
  txDetails,
  isTxDetailsPreview = false,
  hideDecodedData = false,
}: Props): ReactElement => {
  const [expanded, setExpanded] = useState<boolean>(!isTxDetailsPreview)
  const toggleExpanded = () => setExpanded((val) => !val)
  const { txHash, executedAt } = txDetails ?? {}
  const isCustom = txInfo && isCustomTxInfo(txInfo)

  let confirmations, baseGas, gasPrice, gasToken, safeTxGas, refundReceiver, submittedAt, nonce
  if (txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    ;({ confirmations, baseGas, gasPrice, gasToken, safeTxGas, nonce } = txDetails.detailedExecutionInfo)
    refundReceiver = txDetails.detailedExecutionInfo.refundReceiver?.value
  }

  safeTxData = safeTxData ?? {
    to: txData?.to.value ?? ZERO_ADDRESS,
    data: txData?.hexData ?? '0x',
    value: txData?.value ?? BigInt(0).toString(),
    operation: txData?.operation as number,
    baseGas: baseGas ?? BigInt(0).toString(),
    gasPrice: gasPrice ?? BigInt(0).toString(),
    gasToken: gasToken ?? ZERO_ADDRESS,
    nonce: nonce ?? 0,
    refundReceiver: refundReceiver ?? ZERO_ADDRESS,
    safeTxGas: safeTxGas ?? BigInt(0).toString(),
  }

  return (
    <Stack gap={2}>
      <Box>
        {txHash && (
          <TxDataRow datatestid="tx-hash" title="Transaction hash:">
            {generateDataRowValue(txHash, 'hash', true)}
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
      </Box>

      {/* Advanced TxData */}
      {isTxDetailsPreview && (
        <Link
          data-testid="tx-advanced-details"
          className={css.buttonExpand}
          onClick={toggleExpanded}
          component="button"
          variant="body1"
        >
          Advanced details
        </Link>
      )}

      {expanded && (
        <Box mt={isTxDetailsPreview ? 2 : 0}>
          {!isCustom && !hideDecodedData && (
            <>
              <DecodedData txData={txData} toInfo={txData?.to} />
              <Divider />
            </>
          )}

          <Typography fontWeight="bold" pb={1}>
            Transaction data
          </Typography>

          <TxDataRow datatestid="tx-to" title="to:">
            {generateDataRowValue(safeTxData.to, 'address', true)}
          </TxDataRow>

          <TxDataRow datatestid="tx-value" title="value:">
            {generateDataRowValue(safeTxData.value)}
          </TxDataRow>

          <TxDataRow datatestid="tx-raw-data" title="data:">
            {generateDataRowValue(safeTxData.data, 'rawData')}
          </TxDataRow>

          <Box pt={2} />

          <TxDataRow datatestid="tx-operation" title="operation:">
            {`${safeTxData.operation} (${Operation[safeTxData.operation].toLowerCase()})`}
          </TxDataRow>

          <TxDataRow datatestid="tx-safe-gas" title="safeTxGas:">
            {safeTxData.safeTxGas}
          </TxDataRow>

          <TxDataRow datatestid="tx-base-gas" title="baseGas:">
            {safeTxData.baseGas}
          </TxDataRow>

          <TxDataRow datatestid="tx-gas-price" title="gasPrice:">
            {safeTxData.gasPrice}
          </TxDataRow>

          <TxDataRow datatestid="tx-gas-token" title="gasToken:">
            {generateDataRowValue(safeTxData.gasToken, 'hash', true)}
          </TxDataRow>

          <TxDataRow datatestid="tx-refund-receiver" title="refundReceiver:">
            {generateDataRowValue(safeTxData.refundReceiver, 'hash', true)}
          </TxDataRow>

          <TxDataRow datatestid="tx-nonce" title="nonce:">
            {safeTxData.nonce}
          </TxDataRow>

          {!!confirmations && <Box pt={2} />}

          {confirmations?.map(({ signature }, index) => (
            <TxDataRow datatestid="tx-signature" title={`Signature ${index + 1}:`} key={`signature-${index}:`}>
              {generateDataRowValue(signature, 'rawData')}
            </TxDataRow>
          ))}

          <Divider />

          <Typography fontWeight="bold" pb={1}>
            Transaction hashes
          </Typography>
          <SafeTxHashDataRow safeTxData={safeTxData} />
        </Box>
      )}
    </Stack>
  )
}

export default Summary
