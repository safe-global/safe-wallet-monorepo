import EthHashInfo from '@/components/common/EthHashInfo'
import StatusStep from '@/components/new-safe/create/steps/StatusStep/StatusStep'
import useSafeInfo from '@/hooks/useSafeInfo'
import { PendingStatus } from '@/store/pendingTxsSlice'
import { StatusStepperView } from '@views/components/tx-flow/flows/SuccessScreen/StatusStepperView'

const StatusStepper = ({ status, txHash }: { status?: PendingStatus; txHash?: string }) => {
  const { safeAddress } = useSafeInfo()

  const isProcessing = status === PendingStatus.PROCESSING || status === PendingStatus.INDEXING || status === undefined
  const isProcessed = status === PendingStatus.INDEXING || status === undefined
  const isSuccess = status === undefined

  return (
    <StatusStepperView
      isProcessing={isProcessing}
      isProcessed={isProcessed}
      isSuccess={isSuccess}
      txHash={txHash}
      renderStep={({ isLoading, isFirst, children }) => (
        <StatusStep isLoading={isLoading} safeAddress={safeAddress} isFirst={isFirst}>
          {children}
        </StatusStep>
      )}
      renderAddress={(props) => <EthHashInfo {...props} />}
    />
  )
}

export default StatusStepper
