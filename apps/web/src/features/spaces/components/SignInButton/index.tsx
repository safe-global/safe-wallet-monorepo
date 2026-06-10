import WalletLogin, {
  type WalletLoginButtonStyle,
  type WalletLoginButtonText,
} from '@/components/welcome/WelcomeLogin/WalletLogin'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, setAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { AuthLoginMethod, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentSpaceId } from '@/features/spaces'
import useWallet from '@/hooks/wallets/useWallet'
import { getWalletConnectLabel, type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { isSmartContractWallet, isLedger } from '@/utils/wallets'
import { useEffect, useRef } from 'react'

const getSignInErrorMessage = async (wallet: ConnectedWallet | null): Promise<string> => {
  if (wallet?.address && (await isSmartContractWallet(wallet.chainId, wallet.address))) {
    const walletName = getWalletConnectLabel(wallet) || wallet.label
    return `${walletName} for logging into workspace is not supported at the moment.`
  }

  if (wallet && isLedger(wallet)) {
    return 'Ledger for logging into workspace is not supported at the moment.'
  }

  return 'Something went wrong while trying to sign in'
}

interface SignInButtonProps {
  redirectLoading: boolean
  afterSignIn: () => void
  buttonStyle?: WalletLoginButtonStyle
  buttonText?: WalletLoginButtonText
}

const SignInButton = ({ afterSignIn, redirectLoading = false, buttonStyle, buttonText }: SignInButtonProps) => {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { signIn, loading } = useSiwe()
  const spaceId = useCurrentSpaceId()
  // Tracks whether the most recent wallet connect came from the user clicking
  // "Connect wallet" inside this button (vs. them just switching wallets while
  // already signed in). Only the former should chain into a SIWE prompt.
  const autoSignInPending = useRef(false)

  const handleLogin = () => {
    trackEvent({ ...OVERVIEW_EVENTS.OPEN_ONBOARD, label: OVERVIEW_LABELS.space_list_page })
    if (!isUserSignedIn) {
      autoSignInPending.current = true
    }
  }

  const handleSignIn = async () => {
    trackEvent({ ...SPACE_EVENTS.SIGN_IN_BUTTON, label: SPACE_LABELS.space_list_page })

    try {
      const result = await signIn()

      if (result && result.error) {
        throw result.error
      }

      if (result) {
        const oneDayInMs = 24 * 60 * 60 * 1000
        dispatch(setAuthenticated(Date.now() + oneDayInMs))
        trackEvent(
          { ...SPACE_EVENTS.AUTH_LOGIN_SUCCEEDED, label: spaceId ?? undefined },
          { spaceId, method: AuthLoginMethod.SIWE, timestamp: new Date().toISOString() },
        )
        afterSignIn()
      }
    } catch (error) {
      const errorMessage = await getSignInErrorMessage(wallet)

      trackEvent(SPACE_EVENTS.AUTH_LOGIN_FAILED, {
        [MixpanelEventParams.FAILURE_REASON]: error instanceof Error ? error.message : String(error),
        method: AuthLoginMethod.SIWE,
      })
      logError(ErrorCodes._640)

      dispatch(
        showNotification({
          message: errorMessage,
          variant: 'error',
          groupKey: 'sign-in-failed',
        }),
      )
    }
  }

  // After WalletLogin reports a successful connect we still need React to
  // propagate the new wallet into context before SIWE can sign — fire the
  // prompt as soon as wallet becomes non-null.
  useEffect(() => {
    if (!autoSignInPending.current) return
    if (!wallet || isUserSignedIn) return
    autoSignInPending.current = false
    void handleSignIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, isUserSignedIn])

  return (
    <WalletLogin
      onLogin={handleLogin}
      onContinue={handleSignIn}
      isLoading={loading || redirectLoading}
      buttonText={buttonText}
      buttonStyle={buttonStyle}
    />
  )
}

export default SignInButton
