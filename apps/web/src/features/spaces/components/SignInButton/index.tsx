import WalletLogin from '@/components/welcome/WelcomeLogin/WalletLogin'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch } from '@/store'
import { setAuthenticated } from '@/store/authSlice'

const SignInButton = () => {
  const dispatch = useAppDispatch()
  const { signIn } = useSiwe()

  const handleLogin = () => {
    trackEvent({ ...OVERVIEW_EVENTS.OPEN_ONBOARD, label: OVERVIEW_LABELS.space_list_page })
  }

  const handleSignIn = async () => {
    trackEvent({ ...SPACE_EVENTS.SIGN_IN_BUTTON, label: SPACE_LABELS.space_list_page })

    try {
      const result = await signIn()

      // Sign in succeeded
      if (result) {
        const oneDayInMs = 24 * 60 * 60 * 1000
        dispatch(setAuthenticated({ sessionExpiresAt: Date.now() + oneDayInMs }))
      }
    } catch (error) {
      // TODO: handle error
      console.log(error)
    }
  }

  return <WalletLogin onLogin={handleLogin} onContinue={handleSignIn} buttonText="Sign in with" />
}

export default SignInButton
