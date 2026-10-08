import { Fragment, type ReactElement, type ReactNode } from 'react'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import { Typography } from '@/components/ui/typography'

export type StatusStepperViewProps = {
  isProcessing: boolean
  isProcessed: boolean
  isSuccess: boolean
  txHash?: string
  renderStep: (props: { isLoading: boolean; isFirst?: boolean; children: ReactNode }) => ReactNode
  renderAddress: (props: EthHashInfoProps & { showName?: boolean }) => ReactNode
}

const StatusStepperView = ({
  isProcessing,
  isProcessed,
  isSuccess,
  txHash,
  renderStep,
  renderAddress,
}: StatusStepperViewProps): ReactElement => {
  const steps = [
    <Fragment key="tx">
      {renderStep({
        isLoading: !isProcessing,
        isFirst: true,
        children: (
          <div>
            <Typography variant="paragraph-small-bold">Your transaction</Typography>
            {txHash && (
              <div className="font-mono">
                {renderAddress({
                  address: txHash,
                  hasExplorer: true,
                  showCopyButton: true,
                  showName: false,
                  shortAddress: false,
                  showAvatar: false,
                })}
              </div>
            )}
          </div>
        ),
      })}
    </Fragment>,
    <Fragment key="processing">
      {renderStep({
        isLoading: !isProcessed,
        children: (
          <div>
            <Typography variant="paragraph-small-bold">{isProcessed ? 'Processed' : 'Processing'}</Typography>
          </div>
        ),
      })}
    </Fragment>,
    <Fragment key="indexing">
      {renderStep({
        isLoading: !isSuccess,
        children: <Typography variant="paragraph-small-bold">{isSuccess ? 'Indexed' : 'Indexing'}</Typography>,
      })}
    </Fragment>,
    <Fragment key="executed">
      {renderStep({
        isLoading: !isSuccess,
        children: <Typography variant="paragraph-small-bold">Transaction is executed</Typography>,
      })}
    </Fragment>,
  ]

  return (
    <div data-testid="status-stepper" className="flex flex-col">
      {steps}
    </div>
  )
}

export { StatusStepperView }
