import EthHashInfo from '@/components/common/EthHashInfo'
import StatusStep from '@/components/new-safe/create/steps/StatusStep/StatusStep'
import useSafeInfo from '@/hooks/useSafeInfo'
import { PendingStatus } from '@/store/pendingTxsSlice'
import { Typography } from '@/components/ui/typography'

// Vertical gap between step rows, matching the pre-migration MUI StepConnector's 24px min-height.
// Non-last rows get the extra bottom padding so the connector line (::after) has room to reach the
// next step's icon instead of stopping flush against it.
const STEP_CONNECTOR_CLASSES =
  '[&>*:not(:last-child)]:relative [&>*:not(:last-child)]:pb-6 [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:left-[6px] [&>*:not(:last-child)]:after:top-4 [&>*:not(:last-child)]:after:bottom-0 [&>*:not(:last-child)]:after:border-l [&>*:not(:last-child)]:after:border-[var(--color-border-light)]'

const StatusStepper = ({ status, txHash }: { status?: PendingStatus; txHash?: string }) => {
  const { safeAddress } = useSafeInfo()

  const isProcessing = status === PendingStatus.PROCESSING || status === PendingStatus.INDEXING || status === undefined
  const isProcessed = status === PendingStatus.INDEXING || status === undefined
  const isSuccess = status === undefined

  return (
    <div data-testid="status-stepper" className={`flex flex-col ${STEP_CONNECTOR_CLASSES}`}>
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
