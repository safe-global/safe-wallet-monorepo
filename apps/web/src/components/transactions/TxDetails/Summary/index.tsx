import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { memo, type ReactElement } from 'react'
import { isCustomTxInfo, isMultiSendTxInfo, isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import type { SafeTransactionData } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { Receipt } from '@/components/tx/ConfirmTxDetails/Receipt'
import DecodedData from '../TxData/DecodedData'
import ColorCodedTxAccordion from '@/components/tx/ColorCodedTxAccordion'
import isEqual from 'lodash/isEqual'
import Multisend from '../TxData/DecodedData/Multisend'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { useLoadFeature } from '@/features/__core__'
import { GTFFeature, useHistoryFeesBreakdown } from '@/features/gtf'
import { SummaryView } from '@views/components/transactions/TxDetails/Summary/SummaryView'

interface Props {
  safeTxData?: SafeTransactionData
  txData: TransactionDetails['txData']
  txInfo?: TransactionDetails['txInfo']
  txDetails?: TransactionDetails
  showMultisend?: boolean
  showDecodedData?: boolean
  showAuditLogFields?: boolean
}

// GTF (gas-token) fee breakdown for executed txs; the hook returns null when the
// GTF feature is off, so this renders nothing on non-GTF chains.
const HistoryFees = ({ txDetails }: { txDetails: TransactionDetails }): ReactElement | null => {
  const { HistoryFeesAccordion } = useLoadFeature(GTFFeature)
  const feesData = useHistoryFeesBreakdown(txDetails)

  if (!feesData) return null

  return <HistoryFeesAccordion data={feesData} txInfo={txDetails.txInfo} />
}

const Summary = ({
  safeTxData,
  txData,
  txInfo,
  txDetails,
  showMultisend = true,
  showDecodedData = true,
  showAuditLogFields = true,
}: Props): ReactElement => {
  const { txHash, executedAt } = txDetails ?? {}
  const customTxInfo = txInfo && isCustomTxInfo(txInfo) ? txInfo : undefined
  const toInfo = customTxInfo?.to || txData?.addressInfoIndex?.[txData?.to.value] || txData?.to
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
    <SummaryView
      multisend={
        showMultisend &&
        isMultisend && <Multisend txData={transactionData} isExecuted={!!txDetails?.executedAt} compact />
      }
      showAuditLogFields={showAuditLogFields}
      submittedAt={submittedAt}
      executedAt={executedAt}
      txHash={txHash}
      txHashValue={generateDataRowValue(txHash ?? undefined, 'hash', true)}
      historyFees={txDetails?.executedAt && <HistoryFees txDetails={txDetails} />}
      showDetails={showDetails}
      renderAccordion={(children) => (
        <ColorCodedTxAccordion txInfo={txInfo} txData={txData}>
          {children}
        </ColorCodedTxAccordion>
      )}
      showDecodedData={showDecodedData}
      decodedData={<DecodedData txData={txData} toInfo={toInfo} />}
      receipt={
        <Receipt safeTxData={safeTxData} txData={txData} txDetails={txDetails} txInfo={txInfo} withSignatures grid />
      }
    />
  )
}

export default memo(Summary, isEqual)
