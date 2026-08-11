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
    <div className="flex flex-col [&>*:not(:last-child)]:relative [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:left-[6px] [&>*:not(:last-child)]:after:top-4 [&>*:not(:last-child)]:after:h-full [&>*:not(:last-child)]:after:border-l [&>*:not(:last-child)]:after:border-[var(--color-border-light)]">
      <div>
        <StatusStep isLoading={!isProcessing} safeAddress={safeAddress}>
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
      </div>
      <div>
        <StatusStep isLoading={!isProcessed} safeAddress={safeAddress}>
          <div>
            <Typography variant="paragraph-small-bold">{isProcessed ? 'Processed' : 'Processing'}</Typography>
          </div>
        </StatusStep>
      </div>
      <div>
        <StatusStep isLoading={!isSuccess} safeAddress={safeAddress}>
          <Typography variant="paragraph-small-bold">{isSuccess ? 'Indexed' : 'Indexing'}</Typography>
        </StatusStep>
      </div>
      <div>
        <StatusStep isLoading={!isSuccess} safeAddress={safeAddress}>
          <Typography variant="paragraph-small-bold">Transaction is executed</Typography>
        </StatusStep>
      </div>
    </div>
  )
}

export default StatusStepper
