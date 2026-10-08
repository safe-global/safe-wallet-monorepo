import type { ReactElement, ReactNode } from 'react'
import ReviewRow from '@/components/new-safe/ReviewRow'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

export type ActivateAccountFlowViewProps = {
  layout: (title: string, children: ReactElement) => ReactElement
  safeSetupOverview: ReactNode
  executionMethodSelector: ReactElement
  networkFee: ReactNode
  submitError?: ReactNode
  networkWarning: ReactNode
  renderErrorMessage: (children: ReactNode) => ReactNode
  checkWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  canRelay: boolean
  willRelay: boolean
  isWrongChain: boolean
  chainName?: string
  showGasFeeEstimation: boolean
  showInsufficientFunds: boolean
  isSubmittable: boolean
  submitDisabled: boolean
  onActivate: () => void
}

export const ActivateAccountFlowView = ({
  layout,
  safeSetupOverview,
  executionMethodSelector,
  networkFee,
  submitError,
  networkWarning,
  renderErrorMessage,
  checkWallet,
  canRelay,
  willRelay,
  isWrongChain,
  chainName,
  showGasFeeEstimation,
  showInsufficientFunds,
  isSubmittable,
  submitDisabled,
  onActivate,
}: ActivateAccountFlowViewProps) => {
  return layout(
    'Activate account',
    <TxCard>
      <Typography>
        You&apos;re about to deploy this Safe account and will have to confirm the transaction with your connected
        wallet.
      </Typography>

      <Separator bleed="6" className="my-4" />

      {safeSetupOverview}

      {showGasFeeEstimation && <Separator bleed="6" className="mt-4 mb-2" />}
      <div className="flex flex-col gap-6">
        {canRelay && (
          <div>
            <ReviewRow name="Execution method" value={executionMethodSelector} />
          </div>
        )}

        {showGasFeeEstimation && (
          <div data-testid="network-fee-section">
            <ReviewRow
              name="Est. network fee"
              value={
                <>
                  {networkFee}

                  {!willRelay && (
                    <Typography variant="paragraph-small" color="muted" className="block mt-2">
                      {isWrongChain
                        ? `Switch your connected wallet to ${chainName} to see the correct estimated network fee`
                        : 'You will have to confirm a transaction with your connected wallet.'}
                    </Typography>
                  )}
                </>
              }
            />
          </div>
        )}

        {submitError && <div className="mt-2">{submitError}</div>}
        {isWrongChain && networkWarning}
        {showInsufficientFunds &&
          renderErrorMessage(<>Your connected wallet doesn&apos;t have enough funds to execute this transaction</>)}
      </div>

      <Separator bleed="6" className="mt-4 mb-2" />

      <div className="flex flex-row justify-end gap-6">
        {checkWallet((isOk) => (
          <Button
            data-testid="activate-account-flow-btn"
            onClick={onActivate}
            size="lg"
            disabled={!isOk || submitDisabled}
          >
            {!isSubmittable ? <Spinner className="size-5" /> : 'Activate'}
          </Button>
        ))}
      </div>
    </TxCard>,
  )
}
