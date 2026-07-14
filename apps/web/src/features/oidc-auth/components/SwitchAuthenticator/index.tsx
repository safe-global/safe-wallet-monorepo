import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Button, Grid, Paper, Typography } from '@mui/material'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { GATEWAY_URL } from '@/config/gateway'
import useLogout from '@/hooks/useLogout'

const MFA_RESET_PATH = '/v1/auth/oidc/mfa/reset'
const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'
const MFA_RESET_QUERY_PARAM = 'mfaReset'
const MFA_RESET_PENDING_KEY = 'mfa_reset_pending'

const requestMfaReset = (): Promise<Response> =>
  fetch(new URL(MFA_RESET_PATH, GATEWAY_URL), {
    method: 'POST',
    credentials: 'include',
  })

const buildReAuthUrl = (): string => {
  const returnUrl = new URL(window.location.href)
  returnUrl.searchParams.set(MFA_RESET_QUERY_PARAM, 'verify')
  returnUrl.searchParams.delete('error')

  const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
  url.searchParams.set('redirect_url', returnUrl.toString())
  url.searchParams.set('prompt', 'login')
  return url.toString()
}

/**
 * Settings card that lets an OIDC-authenticated user switch their TOTP
 * authenticator app.
 *
 * Auth0 has no "swap authenticator" operation, so switching means deleting
 * the existing MFA enrollments (via CGW -> Auth0 Management API) and signing
 * out. The next sign-in is a cold login with no enrollments, so Auth0's MFA
 * policy forces a fresh enrollment (new QR code + new recovery code).
 *
 * As proof of possession of the current factor, the CGW only accepts the
 * reset while the session is younger than a few minutes (a fresh sign-in
 * implies the MFA challenge — TOTP or recovery code — was just passed):
 * - Fresh session: the reset succeeds directly and the user is logged out.
 * - Stale session (401): the user is first sent through Auth0 with
 *   prompt=login; back in settings (marked by the mfaReset query param +
 *   a sessionStorage flag) the reset is retried with the fresh session.
 */
const SwitchAuthenticator = () => {
  const { data: session } = useAuthGetMeV1Query()
  const router = useRouter()
  const { logout } = useLogout()
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string>()

  const isOidcSession = session?.authMethod === 'oidc'
  const isVerifiedReturn = router.isReady && router.query[MFA_RESET_QUERY_PARAM] === 'verify'

  const resetAndLogout = useCallback(async (): Promise<'done' | 'stale-session'> => {
    const res = await requestMfaReset()

    if (res.status === 401) {
      return 'stale-session'
    }
    if (!res.ok) {
      throw new Error(`Resetting two-factor authentication failed (status ${res.status})`)
    }

    await logout()
    return 'done'
  }, [logout])

  useEffect(() => {
    if (!isVerifiedReturn || !isOidcSession) return
    if (sessionStorage.getItem(MFA_RESET_PENDING_KEY) !== '1') return

    sessionStorage.removeItem(MFA_RESET_PENDING_KEY)
    setIsBusy(true)

    resetAndLogout()
      .then((result) => {
        if (result === 'stale-session') {
          throw new Error('Your sign-in is no longer recent enough. Please try switching again.')
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsBusy(false)
      })
  }, [isVerifiedReturn, isOidcSession, resetAndLogout])

  if (!isOidcSession) {
    return null
  }

  const onSwitch = async () => {
    setError(undefined)
    setIsBusy(true)

    try {
      const result = await resetAndLogout()

      if (result === 'stale-session') {
        sessionStorage.setItem(MFA_RESET_PENDING_KEY, '1')
        window.location.href = buildReAuthUrl()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsBusy(false)
    }
  }

  return (
    <Paper sx={{ padding: 4 }}>
      <Grid container spacing={3}>
        <Grid item lg={4} xs={12}>
          <Typography variant="h4" fontWeight="bold" mb={1}>
            Two-factor authentication
          </Typography>
        </Grid>

        <Grid item xs>
          <Typography mb={2}>
            Switch to a new authenticator app. Unless you signed in just now, you will be asked to verify with your
            current authenticator or recovery code first. Your current authenticator and recovery code are then removed,
            you are signed out, and you set up new ones on your next sign-in.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button variant="contained" onClick={onSwitch} disabled={isBusy} data-testid="switch-authenticator-btn">
            {isBusy ? 'Switching…' : 'Switch authenticator'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SwitchAuthenticator
