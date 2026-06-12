import type { Dispatch, SetStateAction } from 'react'
import classnames from 'classnames'
import { useCurrentChain } from '@/hooks/useChains'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import { Check } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch } from '@/store'
import { setAuthenticated, SESSION_LIFETIME_MS } from '@/store/authSlice'

const PayNowPayLater = ({
  totalFee,
  canRelay,
  isMultiChain,
  payMethod,
  setPayMethod,
  isUserAuthenticated = true,
}: {
  totalFee: string
  canRelay: boolean
  isMultiChain: boolean
  payMethod: PayMethod
  setPayMethod: Dispatch<SetStateAction<PayMethod>>
  isUserAuthenticated?: boolean
}) => {
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const { showGasFeeEstimation, showStablecoinFeeInfo } = useNativeTokenDisplay()
  const { signIn, loading: signingIn } = useSiwe()

  const signInAndSelectPayLater = async () => {
    if (signingIn) return
    const result = await signIn()
    if (result && !result.error) {
      dispatch(setAuthenticated(Date.now() + SESSION_LIFETIME_MS))
      setPayMethod(PayMethod.PayLater)
    }
  }

  const onChoosePayMethod = async (newPayMethod: unknown) => {
    if (newPayMethod === PayMethod.PayLater && !isUserAuthenticated) {
      await signInAndSelectPayLater()
      return
    }
    setPayMethod(newPayMethod as PayMethod)
  }

  return (
    <>
      <Typography variant="h4" className="font-bold">
        Before we continue...
      </Typography>
      {isMultiChain && (
        <ErrorMessage level="info">
          You will need to <b>activate your account</b> separately on each network. Make sure you have funds on your
          wallet to pay the network fee.
        </ErrorMessage>
      )}
      {showStablecoinFeeInfo && (
        <div className="mt-4">
          <ErrorMessage level="info">
            This network uses USD stablecoins for transaction fees instead of a native token. Ensure your connected
            wallet holds a supported stablecoin to cover fees.
          </ErrorMessage>
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
      {!isMultiChain && (
        <div className="w-full">
          <RadioGroup
            value={payMethod}
            onValueChange={onChoosePayMethod}
            className={classnames(css.radioGroup, 'flex flex-row')}
          >
            <Label
              htmlFor="pay-now-execution-method"
              data-testid="pay-now-execution-method"
              className={classnames(css.radioContainer, 'flex-1 cursor-pointer items-center', {
                [css.active]: payMethod === PayMethod.PayNow,
              })}
            >
              <RadioGroupItem id="pay-now-execution-method" value={PayMethod.PayNow} aria-label="Pay now" />
              <span>
                <Typography className={css.radioTitle}>Pay now</Typography>
                {showGasFeeEstimation && (
                  <Typography className={css.radioSubtitle} variant="paragraph-small" color="muted">
                    {canRelay ? (
                      'Sponsored free transaction'
                    ) : (
                      <>
                        &asymp; {totalFee} {chain?.nativeCurrency.symbol}
                      </>
                    )}
                  </Typography>
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
              <span>
                <Typography className={classnames(css.radioTitle, 'inline-flex items-center')}>
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
              <ErrorMessage level="info">
                <Typography
                  variant="paragraph-small"
                  onClick={signInAndSelectPayLater}
                  className={classnames('font-bold text-[var(--color-primary-main)] underline', {
                    'cursor-default opacity-60': signingIn,
                    'cursor-pointer': !signingIn,
                  })}
                >
                  Sign in
                </Typography>{' '}
                to create a Safe without immediate deployment.
              </ErrorMessage>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default PayNowPayLater
