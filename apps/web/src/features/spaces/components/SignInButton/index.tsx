import WalletLogin from '@/components/welcome/WelcomeLogin/WalletLogin'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch } from '@/store'
import { setAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentSpaceId } from '@/features/spaces'
import useWallet from '@/hooks/wallets/useWallet'
import { getWalletConnectLabel, type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { isSmartContractWallet, isLedger } from '@/utils/wallets'

const getSignInErrorMessage = async (wallet: ConnectedWallet | null): Promise<string> => {
  if (wallet?.address && (await isSmartContractWallet(wallet.chainId, wallet.address))) {
    const walletName = getWalletConnectLabel(wallet) || wallet.label
    return `${walletName} is not supported for sign-in. Please use an EOA wallet.`
  }

  if (wallet && isLedger(wallet)) {
    return 'Ledger signing is not supported. Please use a different wallet to sign in.'
  }

  return 'Something went wrong while trying to sign in'
}

interface SignInButtonProps {
  redirectLoading: boolean
  afterSignIn: () => void
}

const SignInButton = ({ afterSignIn, redirectLoading = false }: SignInButtonProps) => {
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const { signIn, loading } = useSiwe()
  const spaceId = useCurrentSpaceId()

  const handleLogin = () => {
    trackEvent({ ...OVERVIEW_EVENTS.OPEN_ONBOARD, label: OVERVIEW_LABELS.space_list_page })
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
        trackEvent({ ...SPACE_EVENTS.SPACES_SIWE_SUCCESS, label: spaceId ?? undefined }, { spaceId })
        afterSignIn()
      }
    } catch (error) {
      const errorMessage = await getSignInErrorMessage(wallet)

      trackEvent(SPACE_EVENTS.SPACES_SIWE_FAILURE, {
        [MixpanelEventParams.FAILURE_REASON]: error instanceof Error ? error.message : String(error),
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

  return (
    <WalletLogin
      onLogin={handleLogin}
      onContinue={handleSignIn}
      isLoading={loading || redirectLoading}
      buttonText="Sign in with"
    />
  )
}

export default SignInButton
