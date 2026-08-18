import EthHashInfo from '@/components/common/EthHashInfo'
import StatusStep from '@/components/new-safe/create/steps/StatusStep/StatusStep'
import useSafeInfo from '@/hooks/useSafeInfo'
import { PendingStatus } from '@/store/pendingTxsSlice'
import { Typography } from '@/components/ui/typography'

const StatusStepper = ({ status, txHash }: { status?: PendingStatus; txHash?: string }) => {
  const { safeAddress } = useSafeInfo()

  const isProcessing = status === PendingStatus.PROCESSING || status === PendingStatus.INDEXING || status === undefined
  const isProcessed = status === PendingStatus.INDEXING || status === undefined
  const isSuccess = status === undefined

  return (
    <div data-testid="status-stepper" className="flex flex-col">
      <StatusStep isLoading={!isProcessing} safeAddress={safeAddress} isFirst>
        <div>
          <Typography variant="paragraph-small-bold">Your transaction</Typography>
          {txHash && (
            <EthHashInfo
              address={txHash}
              hasExplorer
              showCopyButton
              showName={false}
              shortAddress={false}
              showAvatar={false}
            />
          )}
        </div>
      </StatusStep>
      <StatusStep isLoading={!isProcessed} safeAddress={safeAddress}>
        <div>
          <Typography variant="paragraph-small-bold">{isProcessed ? 'Processed' : 'Processing'}</Typography>
        </div>
      </StatusStep>
      <StatusStep isLoading={!isSuccess} safeAddress={safeAddress}>
        <Typography variant="paragraph-small-bold">{isSuccess ? 'Indexed' : 'Indexing'}</Typography>
      </StatusStep>
      <StatusStep isLoading={!isSuccess} safeAddress={safeAddress} isLast>
        <Typography variant="paragraph-small-bold">Transaction is executed</Typography>
      </StatusStep>
    </div>
  )
}

export default StatusStepper
