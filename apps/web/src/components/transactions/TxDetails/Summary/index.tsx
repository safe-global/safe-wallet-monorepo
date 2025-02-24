import type { ReactElement } from 'react'
import React, { useMemo, useState } from 'react'
import { Link, Box } from '@mui/material'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCustomTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import { dateString } from '@/utils/formatters'
import css from './styles.module.css'
import type { SafeTransaction, SafeTransactionData, SafeVersion } from '@safe-global/safe-core-sdk-types'
import SafeTxGasForm from '../SafeTxGasForm'
import DecodedData from '../TxData/DecodedData'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SafeTxHashDataRow } from './SafeTxHashDataRow'
import { logError, Errors } from '@/services/exceptions'

interface Props {
  txDetails: TransactionDetails
  defaultExpanded?: boolean
  hideDecodedData?: boolean
}

const Summary = ({ txDetails, defaultExpanded = false, hideDecodedData = false }: Props): ReactElement => {
  const { safe } = useSafeInfo()
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded)

  const toggleExpanded = () => {
    setExpanded((val) => !val)
  }

  const { txHash, detailedExecutionInfo, executedAt, txData } = txDetails

  let safeTxData: SafeTransactionData | undefined = undefined
  let submittedAt, confirmations, safeTxHash, baseGas, gasPrice, gasToken, refundReceiver, safeTxGas, nonce
  if (isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    ;({ submittedAt, confirmations, safeTxHash, baseGas, gasPrice, gasToken, safeTxGas, nonce } = detailedExecutionInfo)
    refundReceiver = detailedExecutionInfo.refundReceiver?.value
    if (txData) {
      safeTxData = {
        to: txData.to.value,
        data: txData.hexData ?? '0x',
        value: txData.value ?? '0',
        operation: txData.operation as number,
        baseGas,
        gasPrice,
        gasToken,
        nonce,
        refundReceiver,
        safeTxGas,
      }
    }
  }

  const isCustom = isCustomTxInfo(txDetails.txInfo)

  return (
    <>
      {txHash && (
        <TxDataRow datatestid="tx-hash" title="Transaction hash:">
          {generateDataRowValue(txHash, 'hash', true)}{' '}
        </TxDataRow>
      )}
      {safeTxHash && (
        <SafeTxHashDataRow safeTxHash={safeTxHash} safeTxData={safeTxData} safeVersion={safe.version as SafeVersion} />
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
                <Box borderBottom="1px solid" borderColor="border.light" p={2} mt={1} mb={2} mx={-2}>
                  <DecodedData txData={txDetails.txData} toInfo={txDetails.txData?.to} />
                </Box>
              )}

              <TxDataRow datatestid="tx-operation" title="Operation:">
                {`${txData.operation} (${Operation[txData.operation].toLowerCase()})`}
              </TxDataRow>
              <TxDataRow datatestid="tx-safe-gas" title="safeTxGas:">
                {safeTxGas}
              </TxDataRow>
              <TxDataRow datatestid="tx-base-gas" title="baseGas:">
                {baseGas}
              </TxDataRow>
              <TxDataRow datatestid="tx-gas-price" title="gasPrice:">
                {gasPrice}
              </TxDataRow>
              <TxDataRow datatestid="tx-gas-token" title="gasToken:">
                {generateDataRowValue(gasToken, 'hash', true)}
              </TxDataRow>
              <TxDataRow datatestid="tx-refund-receiver" title="refundReceiver:">
                {generateDataRowValue(refundReceiver, 'hash', true)}
              </TxDataRow>
              {confirmations?.map(({ signature }, index) => (
                <TxDataRow datatestid="tx-signature" title={`Signature ${index + 1}:`} key={`signature-${index}:`}>
                  {generateDataRowValue(signature, 'rawData')}
                </TxDataRow>
              ))}

              <Box mt={1}>
                <TxDataRow datatestid="tx-raw-data" title="Raw data:">
                  {generateDataRowValue(txData.hexData, 'rawData')}
                </TxDataRow>
              </Box>
            </Box>
          )}
        </>
      )}
    </>
  )
}

export default Summary

export const PartialSummary = ({ safeTx }: { safeTx: SafeTransaction }) => {
  const txData = safeTx.data
  const { safeAddress, safe } = useSafeInfo()
  const safeTxHash = useMemo(() => {
    if (!safe.version) return
    try {
      return calculateSafeTransactionHash(safeAddress, safeTx.data, safe.version, BigInt(safe.chainId))
    } catch (e) {
      logError(Errors._809, e)
    }
  }, [safe.chainId, safe.version, safeAddress, safeTx.data])
  return (
    <>
      {safeTxHash && (
        <SafeTxHashDataRow safeTxHash={safeTxHash} safeTxData={safeTx.data} safeVersion={safe.version as SafeVersion} />
      )}
      <TxDataRow datatestid="tx-safe-gas" title="safeTxGas:">
        <SafeTxGasForm />
      </TxDataRow>
      <TxDataRow datatestid="tx-base-gas" title="baseGas:">
        {txData.baseGas}
      </TxDataRow>
      <TxDataRow datatestid="tx-refund-receiver" title="refundReceiver:">
        {generateDataRowValue(txData.refundReceiver, 'hash', true)}
      </TxDataRow>

      <Box mt={1}>
        <TxDataRow datatestid="tx-raw-data" title="Raw data:">
          {generateDataRowValue(txData.data, 'rawData')}
        </TxDataRow>
      </Box>
    </>
  )
}
