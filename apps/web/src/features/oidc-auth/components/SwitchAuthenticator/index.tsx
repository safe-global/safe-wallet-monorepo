import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Button, Grid, Paper, Typography } from '@mui/material'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { GATEWAY_URL } from '@/config/gateway'

const MFA_RESET_PATH = '/v1/auth/oidc/mfa/reset'
const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'
const MFA_RESET_QUERY_PARAM = 'mfaReset'
const MFA_RESET_PENDING_KEY = 'mfa_reset_pending'

const buildAuthorizeUrl = (redirectUrl: URL, prompt?: 'login'): string => {
  const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
  url.searchParams.set('redirect_url', redirectUrl.toString())
  if (prompt) {
    url.searchParams.set('prompt', prompt)
  }
  return url.toString()
}

/**
 * Settings card that lets an OIDC-authenticated user switch their TOTP
 * authenticator app.
 *
 * Auth0 has no "swap authenticator" operation, so switching means deleting
 * the existing MFA enrollments (via CGW -> Auth0 Management API) and going
 * through the login flow again, where Auth0's MFA policy forces a fresh
 * enrollment (new QR code + new recovery code).
 *
 * As proof of possession of the current factor, the CGW only accepts the
 * reset within a few minutes of a fresh sign-in, so the flow has two legs:
 * 1. Redirect through Auth0 with prompt=login — the user must pass the MFA
 *    challenge (TOTP or recovery code) to get a freshly minted session.
 * 2. Back in settings (marked by the mfaReset query param + a sessionStorage
 *    flag), call the reset endpoint and redirect through login once more,
 *    where the new authenticator is enrolled.
 */
const SwitchAuthenticator = () => {
  const { data: session } = useAuthGetMeV1Query()
  const router = useRouter()
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string>()

  const isOidcSession = session?.authMethod === 'oidc'
  const isVerifiedReturn = router.isReady && router.query[MFA_RESET_QUERY_PARAM] === 'verify'

  useEffect(() => {
    if (!isVerifiedReturn || !isOidcSession) return
    if (sessionStorage.getItem(MFA_RESET_PENDING_KEY) !== '1') return

    sessionStorage.removeItem(MFA_RESET_PENDING_KEY)
    setIsBusy(true)

    const resetAndReenroll = async () => {
      try {
        const res = await fetch(new URL(MFA_RESET_PATH, GATEWAY_URL), {
          method: 'POST',
          credentials: 'include',
        })

        if (res.status === 401) {
          throw new Error('Your sign-in is no longer recent enough. Please try switching again.')
        }
        if (!res.ok) {
          throw new Error(`Resetting two-factor authentication failed (status ${res.status})`)
        }

        const returnUrl = new URL(window.location.href)
        returnUrl.searchParams.delete(MFA_RESET_QUERY_PARAM)
        window.location.href = buildAuthorizeUrl(returnUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsBusy(false)
      }
    }

    void resetAndReenroll()
  }, [isVerifiedReturn, isOidcSession])

  if (!isOidcSession) {
    return null
  }

  const onSwitch = () => {
    setError(undefined)
    setIsBusy(true)
    sessionStorage.setItem(MFA_RESET_PENDING_KEY, '1')

    const returnUrl = new URL(window.location.href)
    returnUrl.searchParams.set(MFA_RESET_QUERY_PARAM, 'verify')
    returnUrl.searchParams.delete('error')
    window.location.href = buildAuthorizeUrl(returnUrl, 'login')
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
            Switch to a new authenticator app. You will be asked to verify with your current authenticator or recovery
            code first. Afterwards, your current authenticator and recovery code are removed and you can set up new
            ones.
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
