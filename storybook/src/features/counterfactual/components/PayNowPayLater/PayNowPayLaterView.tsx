import type { ReactNode } from 'react'
import classnames from 'classnames'
import { Check } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'

export type PayNowPayLaterViewProps = {
  totalFee: string
  canRelay: boolean
  isMultiChain: boolean
  payMethod: PayMethod
  isUserAuthenticated: boolean
  nativeCurrencySymbol?: string
  showGasFeeEstimation: boolean
  showStablecoinFeeInfo: boolean
  signingIn: boolean
  onChoosePayMethod: (newPayMethod: unknown) => void
  onSignIn: () => void
  renderErrorMessage: (props: { level: 'info'; children: ReactNode }) => ReactNode
}

export const PayNowPayLaterView = ({
  totalFee,
  canRelay,
  isMultiChain,
  payMethod,
  isUserAuthenticated,
  nativeCurrencySymbol,
  showGasFeeEstimation,
  showStablecoinFeeInfo,
  signingIn,
  onChoosePayMethod,
  onSignIn,
  renderErrorMessage,
}: PayNowPayLaterViewProps) => {
  return (
    <>
      <Typography variant="h4" className="font-bold">
        Before we continue...
      </Typography>
      {isMultiChain &&
        renderErrorMessage({
          level: 'info',
          children: (
            <>
              You will need to <b>activate your account</b> separately on each network. Make sure you have funds on your
              wallet to pay the network fee.
            </>
          ),
        })}
      {showStablecoinFeeInfo && (
        <div className="mt-4">
          {renderErrorMessage({
            level: 'info',
            children: (
              <>
                This network uses USD stablecoins for transaction fees instead of a native token. Ensure your connected
                wallet holds a supported stablecoin to cover fees.
              </>
            ),
          })}
        </div>
      )}
      <div className="flex flex-col py-2">
        {isMultiChain && (
          <div className="flex items-center py-2">
            <div className={classnames(css.listItem, 'flex items-center')}>
              <Check className="size-5" />
            </div>
            <Typography variant="paragraph-small">
              Start exploring the accounts now, and activate them later to start making transactions
            </Typography>
          </div>
        )}
        <div className="flex items-center py-2">
          <div className={classnames(css.listItem, 'flex items-center')}>
            <Check className="size-5" />
          </div>
          <Typography variant="paragraph-small">There will be a one-time activation fee</Typography>
        </div>
        {!isMultiChain && (
          <div className="flex items-center py-2">
            <div className={classnames(css.listItem, 'flex items-center')}>
              <Check className="size-5" />
            </div>
            <Typography variant="paragraph-small">
              If you choose to pay later, the fee will be included with the first transaction you make.
            </Typography>
          </div>
        )}
        <div className="flex items-center py-2">
          <div className={classnames(css.listItem, 'flex items-center')}>
            <Check className="size-5" />
          </div>
          <Typography variant="paragraph-small">Safe doesn&apos;t profit from the fees.</Typography>
        </div>
      </div>
      <div className="w-full">
        <RadioGroup
          value={payMethod}
          onValueChange={onChoosePayMethod}
          className={classnames(css.radioGroup, 'flex flex-row')}
        >
          <Label
            htmlFor="pay-now-execution-method"
            data-testid="pay-now-execution-method"
            className={classnames(css.radioContainer, 'flex-1 items-center', {
              [css.active]: payMethod === PayMethod.PayNow,
              'cursor-pointer': !isMultiChain,
              'cursor-not-allowed opacity-60': isMultiChain,
            })}
          >
            <RadioGroupItem
              id="pay-now-execution-method"
              value={PayMethod.PayNow}
              aria-label="Pay now"
              disabled={isMultiChain}
            />
            {/* flex-col: the subtitle belongs on its own line under the label. `paragraph-small`
                renders an inline <span>, so without this it can run on after the title. */}
            <span className="flex flex-col items-start">
              <Typography className={css.radioTitle}>Pay now</Typography>
              {isMultiChain ? (
                <Typography className={css.radioSubtitle} variant="paragraph-small" color="muted">
                  Not available for multiple networks
                </Typography>
              ) : (
                showGasFeeEstimation && (
                  <Typography className={css.radioSubtitle} variant="paragraph-small" color="muted">
                    {canRelay ? (
                      'Sponsored free transaction'
                    ) : (
                      <>
                        &asymp; {totalFee} {nativeCurrencySymbol}
                      </>
                    )}
                  </Typography>
                )
              )}
            </span>
          </Label>

          <Label
            htmlFor="connected-wallet-execution-method"
            data-testid="connected-wallet-execution-method"
            className={classnames(css.radioContainer, 'flex-1 cursor-pointer items-center', {
              [css.active]: payMethod === PayMethod.PayLater,
            })}
          >
            <RadioGroupItem
              id="connected-wallet-execution-method"
              value={PayMethod.PayLater}
              disabled={signingIn}
              aria-label="Pay later"
            />
            <span className="flex flex-col items-start">
              <Typography className={classnames(css.radioTitle, 'flex items-center')}>
                Pay later {signingIn && <Spinner className="ml-1 size-3.5" />}
              </Typography>
              <Typography className={css.radioSubtitle} variant="paragraph-small" color="muted">
                {isUserAuthenticated ? 'with the first transaction' : 'Sign in to enable'}
              </Typography>
            </span>
          </Label>
        </RadioGroup>
        {!isUserAuthenticated && (
          <div className="mt-2">
            {renderErrorMessage({
              level: 'info',
              children: (
                <>
                  <Typography
                    data-testid="sign-in-to-workspace-btn"
                    variant="paragraph-small"
                    onClick={onSignIn}
                    className={classnames('font-bold text-[var(--color-primary-main)] underline', {
                      'cursor-default opacity-60': signingIn,
                      'cursor-pointer': !signingIn,
                    })}
                  >
                    Sign in
                  </Typography>{' '}
                  to create a Safe without immediate deployment.
                </>
              ),
            })}
          </div>
        )}
      </div>
    </>
  )
}
