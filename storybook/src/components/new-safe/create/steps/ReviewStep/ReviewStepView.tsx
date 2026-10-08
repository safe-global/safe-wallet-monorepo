import type { ReactElement, ReactNode } from 'react'
import classnames from 'classnames'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ReviewRow from '@/components/new-safe/ReviewRow'
import { ArrowLeft as ArrowBackIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import css from './styles.module.css'

export const NetworkFee = ({
  totalFee,
  chain,
  isWaived,
  inline = false,
}: {
  totalFee: string
  chain: Chain | undefined
  isWaived: boolean
  inline?: boolean
}) => {
  return (
    <div className={classnames(css.networkFee, { [css.networkFeeInline]: inline })}>
      <Typography className={classnames({ [css.strikethrough]: isWaived })}>
        <b>
          &asymp; {totalFee} {chain?.nativeCurrency.symbol}
        </b>
      </Typography>
    </div>
  )
}

export type SafeSetupOverviewViewProps = {
  name?: string
  networkLabel: string
  networkLogos: ReactNode
  networks: Chain[]
  renderChainIndicator: (chainId: string) => ReactNode
  ownerInfos: ReactNode
  thresholdLabel: string
}

export function SafeSetupOverviewView({
  name,
  networkLabel,
  networkLogos,
  networks,
  renderChainIndicator,
  ownerInfos,
  thresholdLabel,
}: SafeSetupOverviewViewProps): ReactElement {
  return (
    <div className="grid grid-cols-12 gap-6">
      <ReviewRow
        name={networkLabel}
        value={
          <Tooltip>
            <TooltipTrigger
              render={
                <span data-testid="network-list" className="inline-block">
                  {networkLogos}
                </span>
              }
            />
            <TooltipContent>
              <div>
                {networks.map((safeItem) => (
                  <div key={safeItem.chainId} className="py-1">
                    {renderChainIndicator(safeItem.chainId)}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        }
      />
      {name && <ReviewRow name="Name" value={<Typography data-testid="review-step-safe-name">{name}</Typography>} />}
      <ReviewRow
        name="Signers"
        value={
          <div data-testid="review-step-owner-info" className={css.ownersArray}>
            {ownerInfos}
          </div>
        }
      />
      <ReviewRow
        name="Threshold"
        value={<Typography data-testid="review-step-threshold">{thresholdLabel}</Typography>}
      />
    </div>
  )
}

type ErrorMessageSlotProps = {
  level?: 'error' | 'warning' | 'info'
  className?: string
  children: ReactNode
}

export type ReviewStepViewProps = {
  safeSetupOverview: ReactNode
  isCounterfactualEnabled?: boolean
  payNowPayLater: ReactNode
  isPayNow: boolean
  isPayLater: boolean
  canRelay: boolean
  willRelay: boolean
  executionMethodSelector: ReactElement
  showNetworkWarning: boolean
  renderNetworkWarning: (action: string) => ReactNode
  willStayOutsideSpace?: boolean
  spaceSafeLimit?: number | null
  showFeeInConfirmationText: boolean
  showGasFeeEstimation: boolean
  showInsufficientFunds: boolean
  totalFee: string
  chain: Chain | undefined
  renderErrorMessage: (props: ErrorMessageSlotProps) => ReactNode
  submitError?: string
  onBack: () => void
  onCreate: () => void
  isDisabled: boolean
  isCreating: boolean
}

export function ReviewStepView({
  safeSetupOverview,
  isCounterfactualEnabled,
  payNowPayLater,
  isPayNow,
  isPayLater,
  canRelay,
  willRelay,
  executionMethodSelector,
  showNetworkWarning,
  renderNetworkWarning,
  willStayOutsideSpace,
  spaceSafeLimit,
  showFeeInConfirmationText,
  showGasFeeEstimation,
  showInsufficientFunds,
  totalFee,
  chain,
  renderErrorMessage,
  submitError,
  onBack,
  onCreate,
  isDisabled,
  isCreating,
}: ReviewStepViewProps): ReactElement {
  return (
    <>
      <div data-testid="safe-setup-overview" className={layoutCss.row}>
        {safeSetupOverview}
      </div>
      {isCounterfactualEnabled && (
        <>
          <Separator />
          <div data-testid="pay-now-later-message-box" className={layoutCss.row}>
            {payNowPayLater}

            {canRelay && isPayNow && (
              <div className="grid grid-cols-12 gap-6 pt-4">
                <ReviewRow value={executionMethodSelector} />
              </div>
            )}

            {showNetworkWarning && <div className="mt-6">{renderNetworkWarning('create a Safe account')}</div>}

            {isPayLater && willStayOutsideSpace && (
              <div className="mt-4" data-testid="space-seat-limit-notice">
                {renderErrorMessage({
                  level: 'info',
                  children: (
                    <>
                      This Workspace is at its limit of {spaceSafeLimit} Safe accounts. The new Safe will be created in
                      My accounts, outside the Workspace.
                    </>
                  ),
                })}
              </div>
            )}

            {isPayNow && (
              <div className="mt-4">
                <Typography>
                  {!showFeeInConfirmationText ? (
                    'You will have to confirm a transaction with your connected wallet'
                  ) : (
                    <>
                      You will have to confirm a transaction and pay an estimated fee of{' '}
                      <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} inline /> with your connected
                      wallet
                    </>
                  )}
                </Typography>
              </div>
            )}
          </div>
        </>
      )}
      {!isCounterfactualEnabled && (
        <>
          <Separator />
          <div className={`${layoutCss.row} flex flex-col gap-6`}>
            {canRelay && (
              <div className="grid grid-cols-12 gap-6">
                <ReviewRow name="Execution method" value={executionMethodSelector} />
              </div>
            )}

            {showGasFeeEstimation && (
              <div data-testid="network-fee-section" className="grid grid-cols-12 gap-6">
                <ReviewRow
                  name="Est. network fee"
                  value={
                    <>
                      <NetworkFee totalFee={totalFee} isWaived={willRelay} chain={chain} />

                      {!willRelay && (
                        <Typography variant="paragraph-small" className="mt-2 block text-[var(--color-text-secondary)]">
                          You will have to confirm a transaction with your connected wallet.
                        </Typography>
                      )}
                    </>
                  }
                />
              </div>
            )}

            {showNetworkWarning && renderNetworkWarning('create a Safe account')}

            {showInsufficientFunds &&
              renderErrorMessage({
                children: <>Your connected wallet doesn&apos;t have enough funds to execute this transaction</>,
              })}
          </div>
        </>
      )}
      <Separator />
      <div className={layoutCss.row}>
        {submitError && renderErrorMessage({ className: css.errorMessage, children: submitError })}
        <div className="flex flex-row justify-between gap-6">
          <Button data-testid="back-btn" variant="outline" size="lg" onClick={onBack}>
            <ArrowBackIcon className="size-4" />
            Back
          </Button>
          <Button
            data-testid="review-step-next-btn"
            onClick={onCreate}
            variant="default"
            size="lg"
            disabled={isDisabled}
          >
            {isCreating ? <Spinner className="size-[18px]" /> : 'Create account'}
          </Button>
        </div>
      </div>
    </>
  )
}
