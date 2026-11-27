import type { MetaTransactionData } from '@safe-global/types-kit'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import { Alert, AlertDescription } from '@safe-global/views/components/ui/alert'

export const GnosisPayTxDetails = ({ txData }: { txData: MetaTransactionData }) => {
  const [preview, error, loading] = useTxPreview({ ...txData, operation: txData.operation ?? 0 })
  const data: NonNullable<TransactionDetails['txData']> = {
    to: { value: txData.to },
    value: txData.value,
    hexData: txData.data,
    operation: txData.operation ?? 0,
    dataDecoded: preview?.txData?.dataDecoded ?? null,
    addressInfoIndex: preview?.txData?.addressInfoIndex ?? null,
  }
  return (
    <div className="space-y-4 p-4">
      <p>Value (wei): {txData.value}</p>
      {loading && <p role="status">Decoding transaction…</p>}
      {error && (
        <Alert variant="warning">
          <AlertDescription>Could not decode the transaction. Review the raw data below.</AlertDescription>
        </Alert>
      )}
      <DecodedData txData={data} isWarningEnabled />
    </div>
  )
}
