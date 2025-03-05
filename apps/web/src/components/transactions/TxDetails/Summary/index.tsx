import type { ReactElement } from 'react'
import React, { useState } from 'react'
import { Link, Box, Typography } from '@mui/material'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCustomTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import { type SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import { dateString } from '@/utils/formatters'
import css from './styles.module.css'
import DecodedData from '../TxData/DecodedData'
import { SafeTxHashDataRow } from './SafeTxHashDataRow'
import { Divider } from '@/components/tx/DecodedTx'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

interface Props {
  txData: TransactionDetails['txData']
  txInfo?: TransactionDetails['txInfo']
  txDetails?: TransactionDetails
  defaultExpanded?: boolean
  hideDecodedData?: boolean
}

const Summary = ({
  txData,
  txInfo,
  txDetails,
  defaultExpanded = false,
  hideDecodedData = false,
}: Props): ReactElement => {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded)
  const toggleExpanded = () => setExpanded((val) => !val)
  const { txHash, executedAt } = txDetails ?? {}
  const isCustom = txInfo && isCustomTxInfo(txInfo)

  let confirmations, baseGas, gasPrice, gasToken, safeTxGas, refundReceiver, submittedAt, nonce
  if (txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    ;({ confirmations, baseGas, gasPrice, gasToken, safeTxGas, nonce } = txDetails.detailedExecutionInfo)
    refundReceiver = txDetails.detailedExecutionInfo.refundReceiver?.value
  }

  const safeTxData: SafeTransactionData = {
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

      {/* Advanced TxData */}
      {txData && (
        <>
          {!defaultExpanded && (
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
            <Box mt={1}>
              {!isCustom && !hideDecodedData && (
                <>
                  <Divider />
                  <DecodedData txData={txData} toInfo={txData?.to} />
                  <Divider />
                </>
              )}

              <Typography fontWeight="bold" pb={1}>
                Transaction data
              </Typography>

              <TxDataRow datatestid="tx-to" title="to:">
                {generateDataRowValue(txData.to.value, 'address', true)}
              </TxDataRow>

              <TxDataRow datatestid="tx-to" title="value:">
                {generateDataRowValue(txData.value)}
              </TxDataRow>

              <TxDataRow datatestid="tx-raw-data" title="data:">
                {generateDataRowValue(txData.hexData, 'rawData')}
              </TxDataRow>

              <Box pt={2} />

              <TxDataRow datatestid="tx-operation" title="Operation:">
                {`${txData.operation} (${Operation[txData.operation].toLowerCase()})`}
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

              {confirmations?.map(({ signature }, index) => (
                <TxDataRow datatestid="tx-signature" title={`Signature ${index + 1}:`} key={`signature-${index}:`}>
                  {generateDataRowValue(signature, 'rawData')}
                </TxDataRow>
              ))}

              <Divider />

              <Typography fontWeight="bold" pb={1}>
                Transaction hashes
              </Typography>
              {txData && <SafeTxHashDataRow safeTxData={safeTxData} />}
            </Box>
          )}
        </>
      )}
    </>
  )
}

export default Summary
