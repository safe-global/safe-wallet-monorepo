import type { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Box, Typography, Card, SvgIcon } from '@mui/material'
import { GradientCircularProgress } from '@/components/common/GradientCircularProgress'
import { readPkce, clearPkce, useAuthToken, HYPERNATIVE_OAUTH_CONFIG, getRedirectUri } from '@/features/hypernative'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import InfoIcon from '@/public/images/notifications/info.svg'
import CheckIcon from '@/public/images/common/check.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'

/**
 * OAuth callback page for Hypernative authentication
 *
 * This page handles the OAuth redirect after user authorization:
 * 1. Extracts authorization code and state from URL query params
 * 2. Retrieves PKCE code verifier from sessionStorage
 * 3. Exchanges authorization code for access token
 * 4. Stores token in Redux and posts message to parent window
 * 5. Closes popup or shows success message
 *
 * Flow:
 * - User authorizes on Hypernative OAuth page
 * - Hypernative redirects back to this page with code & state
 * - This page exchanges code for token and notifies parent window
 * - Popup closes automatically after successful token exchange
 */
const HypernativeOAuthCallback: NextPage = () => {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const hasProcessedRef = useRef(false)
  const isDarkMode = useDarkMode()
  const [exchangeToken] = hypernativeApi.useExchangeTokenMutation()
  const [_, setToken] = useAuthToken()

  useEffect(() => {
    /**
     * Handle the OAuth callback flow
     */
    const handleCallback = async () => {
      // Prevent double processing (e.g., React Strict Mode, navigation changes)
      if (hasProcessedRef.current) {
        return
      }

      hasProcessedRef.current = true

      try {
        // Step 1: Extract query parameters
        const { code, state, error, error_description } = router.query

        // Clean URL history immediately after extracting parameters
        // This prevents the authorization code from appearing in browser history
        // (security best practice - avoids leaking sensitive OAuth codes)
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
        }

        // Check for OAuth errors
        if (error) {
          const errorMsg = error_description ? String(error_description) : String(error)
          throw new Error(`OAuth authorization failed: ${errorMsg}`)
        }

        // Validate required parameters
        if (!code || typeof code !== 'string') {
          throw new Error('Missing authorization code in callback URL')
        }

        if (!state || typeof state !== 'string') {
          throw new Error('Missing state parameter in callback URL')
        }

        // Step 2: Retrieve PKCE data (state and codeVerifier)
        const pkce = readPkce()

        // Step 3: Verify OAuth state (CSRF protection)
        if (!state || state !== pkce.state) {
          throw new Error('Invalid OAuth state parameter - possible CSRF attack')
        }

        // Step 4: Validate codeVerifier exists
        if (!pkce.codeVerifier) {
          throw new Error('Missing PKCE code verifier - authentication flow corrupted')
        }

        // Step 5: Exchange authorization code for access token
        const redirectUri = getRedirectUri()
        const { clientId } = HYPERNATIVE_OAUTH_CONFIG

        const tokenResponse = await exchangeToken({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: pkce.codeVerifier,
        }).unwrap()

        // Validate response structure
        if (!tokenResponse.access_token || !tokenResponse.expires_in) {
          throw new Error('Invalid token response: missing access_token or expires_in')
        }

        // Step 6: Store token in cookie
        setToken(tokenResponse.access_token, tokenResponse.token_type, tokenResponse.expires_in)

        // Step 7: Clean up sessionStorage
        clearPkce()

        // Step 8: Update UI state
        setStatus('success')

        // Step 8.5: Track successful authentication
        trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_CONNECTED)

        // Step 9: Close popup after short delay (allow postMessage to be delivered)
        setTimeout(() => {
          window.close()
        }, 1000)
      } catch (error) {
        console.error('OAuth callback error:', error)
        let errorMsg = 'Unknown authentication error'
        if (error instanceof Error) {
          errorMsg = error.message
        } else if (error && typeof error === 'object' && 'data' in error) {
          // RTK Query error format
          const rtkError = error as { data?: unknown; status?: number }
          if (typeof rtkError.data === 'string') {
            errorMsg = rtkError.data
          } else if (rtkError.status) {
            errorMsg = `Token exchange failed: ${rtkError.status}`
          }
        }
        setErrorMessage(errorMsg)
        setStatus('error')

        // Clean up PKCE data on error
        clearPkce()

        // Reset flag on error so user can retry
        hasProcessedRef.current = false
      }
    }

    // Only run callback handling when router is ready
    if (router.isReady) {
      handleCallback()
    }
  }, [router.isReady, router.query, exchangeToken, setToken])

  return (
    <>
      <Head>
        <title>Hypernative Authentication</title>
      </Head>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        padding={3}
        mt="calc(-1 * var(--header-height))" // subtract header height to center content in the viewport
      >
        <Card
          sx={{ p: 4, justifyItems: 'center', textAlign: 'center', borderRadius: 2, maxWidth: 433, width: { sm: 433 } }}
        >
          {status === 'loading' && (
            <>
              <GradientCircularProgress size={40} thickness={5} />
              <Typography variant="h3" fontWeight={700} marginTop={3}>
                Authentication in progress
              </Typography>
              <Typography variant="body2" color="text.secondary" marginTop={1}>
                Hypernative authentication is in progress. Don’t close this window.
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <Box
                sx={{
                  backgroundColor: 'success.background',
                  width: 40,
                  height: 40,
                  borderRadius: 40,
                  padding: 1,
                }}
              >
                <SvgIcon component={CheckIcon} inheritViewBox color="success" width={20} height={20} />
              </Box>
              <Typography variant="h3" fontWeight={700} marginTop={3}>
                Login successful
              </Typography>
              <Typography variant="body2" color="text.secondary" marginTop={1}>
                You’re now signed in to Hypernative.
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Box
                sx={{
                  backgroundColor: isDarkMode ? 'info.background' : 'info.light',
                  width: 40,
                  height: 40,
                  borderRadius: 40,
                  padding: 1,
                }}
              >
                <SvgIcon component={InfoIcon} inheritViewBox color="info" width={20} height={20} />
              </Box>
              <Typography variant="h3" fontWeight={700} marginTop={3}>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary" marginTop={1}>
                {errorMessage}
              </Typography>
            </>
          )}
        </Card>
      </Box>
    </>
  )
}

export default HypernativeOAuthCallback
