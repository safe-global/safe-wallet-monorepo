import type { Dispatch, SetStateAction } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch } from '@/store'
import { setAuthenticated, SESSION_LIFETIME_MS } from '@/store/authSlice'
import { PayNowPayLaterView } from '@views/features/counterfactual/components/PayNowPayLater/PayNowPayLaterView'

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
    <PayNowPayLaterView
      totalFee={totalFee}
      canRelay={canRelay}
      isMultiChain={isMultiChain}
      payMethod={payMethod}
      isUserAuthenticated={isUserAuthenticated}
      nativeCurrencySymbol={chain?.nativeCurrency.symbol}
      showGasFeeEstimation={showGasFeeEstimation}
      showStablecoinFeeInfo={showStablecoinFeeInfo}
      signingIn={signingIn}
      onChoosePayMethod={onChoosePayMethod}
      onSignIn={signInAndSelectPayLater}
      renderErrorMessage={(props) => <ErrorMessage {...props} />}
    />
  )
}

export default PayNowPayLater
