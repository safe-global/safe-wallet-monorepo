import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert } from '@/components/ui/alert'
import TxCheckError from '@/components/tx/TxCheckError'
import TxSubmitError from '@/components/tx/TxSubmitError'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/shared/ConfirmationTitle'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'

const BatchErrorMessages = ({
  estimationError,
  submitError,
  refusalMessage,
  isRejectedByUser,
}: {
  estimationError?: Error
  submitError: Error | undefined
  refusalMessage?: string
  isRejectedByUser: boolean
}) => (
  <>
    {estimationError && <TxCheckError error={estimationError} context="estimation" />}
    {submitError && <TxSubmitError error={submitError} context="execution" />}
    {refusalMessage && <ErrorMessage level="warning">{refusalMessage}</ErrorMessage>}
    {isRejectedByUser && <WalletRejectionError />}
  </>
)

export type ReviewBatchViewProps = {
  txCount: number
  hasMultiSendContract: boolean
  renderSendToBlock: (props: { title: string }) => ReactNode
  multiSendTxData?: string
  decodedTxs: ReactNode
  networkWarning: ReactNode
  showExecutionMethodSelector: boolean
  renderExecutionMethodSelector: (props: { tooltip: string }) => ReactNode
  estimationError?: Error
  submitError?: Error
  refusalMessage?: string
  isRejectedByUser: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  submitDisabled: boolean
  isSubmittable: boolean
  onSubmit: (e: SyntheticEvent) => void
}

export const ReviewBatchView = ({
  txCount,
  hasMultiSendContract,
  renderSendToBlock,
  multiSendTxData,
  decodedTxs,
  networkWarning,
  showExecutionMethodSelector,
  renderExecutionMethodSelector,
  estimationError,
  submitError,
  refusalMessage,
  isRejectedByUser,
  renderCheckWallet,
  submitDisabled,
  isSubmittable,
  onSubmit,
}: ReviewBatchViewProps): ReactElement => {
  return (
    <>
      <TxCard>
        <Typography variant="paragraph-small" className="block">
          This transaction batches a total of {txCount} transactions from your queue into a single Ethereum transaction.
          Please check every included transaction carefully, especially if you have rejection transactions, and make
          sure you want to execute all of them. Included transactions are highlighted when you hover over the execute
          button.
        </Typography>

        {hasMultiSendContract && renderSendToBlock({ title: 'Interact with' })}

        {multiSendTxData && <HexEncodedData title="Data" hexData={multiSendTxData} />}

        <div>{decodedTxs}</div>

        <Separator bleed="6" className="mt-4" />

        <ConfirmationTitle variant={ConfirmationTitleTypes.execute} />

        {networkWarning}

        {showExecutionMethodSelector &&
          renderExecutionMethodSelector({
            tooltip: 'You can only relay multisend transactions containing executions from the same Safe account.',
          })}

        <Alert variant="warning" outlined={false}>
          Be aware that if any of the included transactions revert, none of them will be executed. This will result in
          the loss of the allocated transaction fees.
        </Alert>

        <BatchErrorMessages
          refusalMessage={refusalMessage}
          estimationError={estimationError}
          submitError={submitError}
          isRejectedByUser={isRejectedByUser}
        />

        <div>
          <div className="pt-4">
            <Separator bleed="6" />
          </div>

          <TxCardActions>
            {renderCheckWallet((isOk) => (
              <Button type="submit" size="submit" disabled={!isOk || submitDisabled} onClick={onSubmit}>
                {!isSubmittable ? <Spinner className="size-5" /> : 'Submit'}
              </Button>
            ))}
          </TxCardActions>
        </div>
      </TxCard>
    </>
  )
}
