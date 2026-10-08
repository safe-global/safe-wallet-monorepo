import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import TxSubmitError from '@/components/tx/TxSubmitError'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import FieldsGrid from '@/components/tx/FieldsGrid'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'

export type RecoveryAttemptReviewViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  executor: string
  renderAddress: (props: EthHashInfoProps & { showName?: boolean }) => ReactNode
  recoveryDescription: ReactNode
  networkWarning: ReactNode
  validationErrors: ReactNode
  error?: Error
  isLoading: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
}

const RecoveryAttemptReviewView = ({
  onSubmit,
  executor,
  renderAddress,
  recoveryDescription,
  networkWarning,
  validationErrors,
  error,
  isLoading,
  renderCheckWallet,
}: RecoveryAttemptReviewViewProps): ReactElement => {
  return (
    <TxCard>
      <form onSubmit={onSubmit}>
        <div className="mb-4 flex flex-col gap-6">
          <Typography>Execute this transaction to finalize the recovery.</Typography>

          <FieldsGrid title="Initiator">
            {renderAddress({ address: executor, showName: true, showCopyButton: true, hasExplorer: true })}
          </FieldsGrid>

          <Separator bleed="6" />

          {recoveryDescription}

          {networkWarning}

          {validationErrors}

          {error && <TxSubmitError error={error} />}
        </div>

        <Separator bleed="6" className="my-7" />

        <TxCardActions>
          {/* Submit button, also available to non-owner role members */}
          {renderCheckWallet((isOk) => (
            <Button
              data-testid="execute-through-role-form-btn"
              variant="default"
              size="submit"
              type="submit"
              disabled={!isOk || isLoading}
            >
              {isLoading ? <Spinner className="size-5" /> : 'Execute'}
            </Button>
          ))}
        </TxCardActions>
      </form>
    </TxCard>
  )
}

export { RecoveryAttemptReviewView }
