import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import SafenetTransactionDetails from '@/features/safenet/components/SafenetTransactionDetails'
import useHasSafenetFeature from '@/features/safenet/hooks/useHasSafenetFeature'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { dateString } from '@/utils/formatters'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { Box, Stack } from '@mui/material'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import type { SafeTransaction, SafeTransactionData, SafeVersion } from '@safe-global/safe-core-sdk-types'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import SafeTxGasForm from '../SafeTxGasForm'
import { AdvancedTxDetails } from './AdvancedTxDetails'
import { SafeTxHashDataRow } from './SafeTxHashDataRow'

interface Props {
  txDetails: TransactionDetails
  defaultExpanded?: boolean
  hideDecodedData?: boolean
}

const Summary = ({ txDetails, defaultExpanded = false, hideDecodedData = false }: Props): ReactElement => {
  const { safe } = useSafeInfo()
  const isSafenetEnabled = useHasSafenetFeature()

  const { txHash, detailedExecutionInfo, executedAt, txData } = txDetails

  let safeTxData: SafeTransactionData | undefined = undefined
  let submittedAt, safeTxHash, baseGas, gasPrice, gasToken, refundReceiver, safeTxGas, nonce
  if (isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    ;({ submittedAt, safeTxHash, baseGas, gasPrice, gasToken, safeTxGas, nonce } = detailedExecutionInfo)
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

  return (
    <Stack gap={2}>
      <Box>
        {isSafenetEnabled && safeTxHash && <SafenetTransactionDetails safeTxHash={safeTxHash} />}

        {txHash && (
          <TxDataRow datatestid="tx-hash" title="Transaction hash:">
            {generateDataRowValue(txHash, 'hash', true)}
          </TxDataRow>
        )}
        {safeTxHash && (
          <SafeTxHashDataRow
            safeTxHash={safeTxHash}
            safeTxData={safeTxData}
            safeVersion={safe.version as SafeVersion}
          />
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

      <AdvancedTxDetails txDetails={txDetails} defaultExpanded={defaultExpanded} hideDecodedData={hideDecodedData} />
    </Stack>
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
