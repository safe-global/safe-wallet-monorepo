import WalletLogin from '@/components/welcome/WelcomeLogin/WalletLogin'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { ORG_EVENTS, SIGN_IN_BUTTON_LABELS } from '@/services/analytics/events/organizations'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch } from '@/store'
import { setAuthenticated } from '@/store/authSlice'

const SignInButton = () => {
  const dispatch = useAppDispatch()
  const { signIn } = useSiwe()

  const handleLogin = () => {
    trackEvent({ ...OVERVIEW_EVENTS.OPEN_ONBOARD, label: OVERVIEW_LABELS.orgs_list_page })
  }

  const handleSignIn = async () => {
    trackEvent({ ...ORG_EVENTS.SIGN_IN_BUTTON, label: SIGN_IN_BUTTON_LABELS.orgs_list_page })

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
