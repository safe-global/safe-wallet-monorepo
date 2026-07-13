import { useState } from 'react'
import { Alert, Button, Grid, Paper, Typography } from '@mui/material'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { GATEWAY_URL } from '@/config/gateway'

const MFA_RESET_PATH = '/v1/auth/oidc/mfa/reset'
const AUTHORIZE_PATH = '/v1/auth/oidc/authorize'

/**
 * Settings card that lets an OIDC-authenticated user switch their TOTP
 * authenticator app.
 *
 * Auth0 has no "swap authenticator" operation, so switching means deleting
 * the existing MFA enrollments (via CGW -> Auth0 Management API) and going
 * through the login flow again, where Auth0's MFA policy forces a fresh
 * enrollment (new QR code + new recovery code).
 */
const SwitchAuthenticator = () => {
  const { data: session } = useAuthGetMeV1Query()
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string>()

  if (session?.authMethod !== 'oidc') {
    return null
  }

  const onSwitch = async () => {
    setIsResetting(true)
    setError(undefined)

    try {
      const res = await fetch(new URL(MFA_RESET_PATH, GATEWAY_URL), {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`Resetting two-factor authentication failed (status ${res.status})`)
      }

      const url = new URL(AUTHORIZE_PATH, GATEWAY_URL)
      url.searchParams.set('redirect_url', window.location.href)
      window.location.href = url.toString()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsResetting(false)
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
            Switch to a new authenticator app. Your current authenticator and recovery code will be removed, and you
            will be asked to sign in again and set up a new one.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button variant="contained" onClick={onSwitch} disabled={isResetting} data-testid="switch-authenticator-btn">
            {isResetting ? 'Switching…' : 'Switch authenticator'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SwitchAuthenticator
