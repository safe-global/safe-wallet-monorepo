import { Fragment } from 'react'
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

  const steps = [
    <StatusStep key="tx" isLoading={!isProcessing} safeAddress={safeAddress}>
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
    </StatusStep>,
    <StatusStep key="processing" isLoading={!isProcessed} safeAddress={safeAddress}>
      <div>
        <Typography variant="paragraph-small-bold">{isProcessed ? 'Processed' : 'Processing'}</Typography>
      </div>
    </StatusStep>,
    <StatusStep key="indexing" isLoading={!isSuccess} safeAddress={safeAddress}>
      <Typography variant="paragraph-small-bold">{isSuccess ? 'Indexed' : 'Indexing'}</Typography>
    </StatusStep>,
    <StatusStep key="executed" isLoading={!isSuccess} safeAddress={safeAddress}>
      <Typography variant="paragraph-small-bold">Transaction is executed</Typography>
    </StatusStep>,
  ]

  return (
    <div data-testid="status-stepper" className="flex flex-col">
      {steps.map((step, index) => (
        <Fragment key={index}>
          {/* Standalone segment between rows, like MUI's StepConnector: it does not touch the
              dots — the gap comes from the dot sitting centered within its row. */}
          {index > 0 && (
            <div
              data-testid="status-step-connector"
              className="ml-[6.5px] min-h-9 w-px bg-[var(--color-border-light)]"
            />
          )}
          {step}
        </Fragment>
      ))}
    </div>
  )
}

export default StatusStepper
