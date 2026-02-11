import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Link, Button } from '@mui/material'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasSafes } from '@/features/myAccounts'
import Track from '@/components/common/Track'
import { useCallback, useEffect, useRef, useState } from 'react'
import WalletLogin from './WalletLogin'
import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, lastUsedSpace, setAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useLazySpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useLazyUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { filterSpacesByStatus } from '@/features/spaces/utils'
import { MemberStatus } from '@/features/spaces/hooks/useSpaceMembers'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'

const WelcomeLogin = () => {
  const router = useRouter()
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const { hasSafes } = useHasSafes()
  const { signIn } = useSiwe()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const storedLastUsedSpace = useAppSelector(lastUsedSpace)
  const [fetchSpaces] = useLazySpacesGetV1Query()
  const [fetchCurrentUser] = useLazyUsersGetWithWalletsV1Query()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const signingInRef = useRef(false)

  const redirectToSpaceOrOnboarding = useCallback(async () => {
    try {
      const [spacesResult, userResult] = await Promise.all([fetchSpaces(), fetchCurrentUser()])

      const spaces = spacesResult.data
      const currentUser = userResult.data

      if (spaces && spaces.length > 0 && currentUser) {
        const activeSpaces = filterSpacesByStatus(currentUser, spaces, MemberStatus.ACTIVE)

        if (activeSpaces.length > 0) {
          // Verify the last used space is one the user is still a member of
          const isLastUsedSpaceValid =
            storedLastUsedSpace != null && activeSpaces.some((space) => space.id.toString() === storedLastUsedSpace)

          const targetSpaceId = isLastUsedSpaceValid ? storedLastUsedSpace : activeSpaces[0].id.toString()

          router.push({ pathname: AppRoutes.spaces.index, query: { spaceId: targetSpaceId } })
          return
        }
      }

      // No spaces or no active spaces — redirect to onboarding
      router.push({ pathname: AppRoutes.onboarding.createSpace })
    } catch {
      // On failure, fall back to onboarding
      router.push({ pathname: AppRoutes.onboarding.createSpace })
    }
  }, [fetchSpaces, fetchCurrentUser, storedLastUsedSpace, router])

  const performSiweAndRedirect = useCallback(async () => {
    // Prevent re-entry: the effect can re-fire when deps like isUserAuthenticated
    // change mid-flow, which would trigger duplicate MetaMask prompts.
    if (signingInRef.current) return
    signingInRef.current = true
    setIsSigningIn(true)

    try {
      // Skip SIWE if already authenticated
      if (!isUserAuthenticated) {
        trackEvent({ ...SPACE_EVENTS.SIGN_IN_BUTTON, label: OVERVIEW_LABELS.welcome_page })

        const result = await signIn()

        if (result && result.error) {
          throw result.error
        }

        if (!result) {
          // User rejected or provider unavailable — stay on welcome
          return
        }

        const oneDayInMs = 24 * 60 * 60 * 1000
        dispatch(setAuthenticated(Date.now() + oneDayInMs))
      }

      await redirectToSpaceOrOnboarding()
    } catch (error) {
      logError(ErrorCodes._640)

      dispatch(
        showNotification({
          message: 'Something went wrong while trying to sign in',
          variant: 'error',
          groupKey: 'sign-in-failed',
        }),
      )
    } finally {
      signingInRef.current = false
      setIsSigningIn(false)
    }
  }, [isUserAuthenticated, signIn, dispatch, redirectToSpaceOrOnboarding])

  const onLogin = useCallback(() => {
    setShouldRedirect(true)
  }, [])

  useEffect(() => {
    if (!shouldRedirect) return
    if (!wallet) return

    performSiweAndRedirect()
  }, [shouldRedirect, wallet, performSiweAndRedirect])

  return (
    <Paper className={css.loginCard} data-testid="welcome-login" style={{ background: '#fff' }}>
      <Box className={css.loginContent}>
        <Typography variant="h2" mt={6} fontWeight={700}>
          Get started
        </Typography>

        <Typography mb={2} textAlign="center" className={css.loginDescription}>
          {wallet
            ? 'Sign in to access your spaces or create a new one'
            : 'Connect your wallet to create a Safe Account or watch an existing one'}
        </Typography>

        <Box className={css.fullWidth}>
          <Track {...OVERVIEW_EVENTS.OPEN_ONBOARD} label={OVERVIEW_LABELS.welcome_page}>
            <WalletLogin onLogin={onLogin} onContinue={performSiweAndRedirect} isLoading={isSigningIn} fullWidth />
          </Track>
        </Box>

        {!wallet && (
          <>
            <Divider sx={{ mt: 2, mb: 2, width: '100%' }} className={css.orDivider}>
              <Typography color="text.secondary" fontWeight={700} variant="overline">
                or
              </Typography>
            </Divider>
            {hasSafes ? (
              <Link href={AppRoutes.welcome.accounts}>
                <Button disableElevation size="small">
                  View my accounts
                </Button>
              </Link>
            ) : (
              <Link href={AppRoutes.newSafe.load} className={css.watchViewAccountLink}>
                <Button disableElevation size="small">
                  Watch any account
                </Button>
              </Link>
            )}
          </>
        )}
      </Box>
    </Paper>
  )
}

export default WelcomeLogin
