import type { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Box, CircularProgress, Typography, Alert } from '@mui/material'
import { setAuthCookie } from '@/features/hypernative/store/cookieStorage'
import {
  HN_AUTH_SUCCESS_EVENT,
  HN_AUTH_ERROR_EVENT,
  readPkce,
  clearPkce,
} from '@/features/hypernative/hooks/useHypernativeOAuth'
import { HYPERNATIVE_OAUTH_CONFIG, getRedirectUri } from '@/features/hypernative/config/oauth'

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
        const tokenResponse = await exchangeCodeForToken(code, pkce.codeVerifier)

        // Step 6: Store token in cookie
        setAuthCookie(tokenResponse.access_token, tokenResponse.expires_in)

        // Step 7: Clean up sessionStorage
        clearPkce()

        // Step 8: Notify parent window of successful authentication
        if (window.opener) {
          window.opener.postMessage(
            {
              type: HN_AUTH_SUCCESS_EVENT,
              token: tokenResponse.access_token,
              expiresIn: tokenResponse.expires_in,
            },
            window.location.origin,
          )
        }

        // Step 9: Update UI state
        setStatus('success')

        // Step 10: Close popup after short delay (allow postMessage to be delivered)
        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            window.close()
          }
        }, 1000)
      } catch (error) {
        console.error('OAuth callback error:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown authentication error'
        setErrorMessage(errorMsg)
        setStatus('error')

        // Clean up PKCE data on error
        clearPkce()

        // Reset flag on error so user can retry
        hasProcessedRef.current = false

        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage(
            {
              type: HN_AUTH_ERROR_EVENT,
              error: errorMsg,
            },
            window.location.origin,
          )
        }

        // Close popup after delay even on error
        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            window.close()
          }
        }, 3000)
      }
    }

    // Only run callback handling when router is ready
    if (router.isReady) {
      handleCallback()
    }
  }, [router.isReady, router.query])

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
      >
        {status === 'loading' && (
          <>
            <CircularProgress size={60} />
            <Typography variant="h6" marginTop={3}>
              Authentication in progress...
            </Typography>
            <Typography variant="body2" color="text.secondary" marginTop={1}>
              Please wait while we complete your login
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <Typography variant="h6" color="success.main">
              Authentication successful!
            </Typography>
            <Typography variant="body2" color="text.secondary" marginTop={1}>
              This window will close automatically
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ maxWidth: 500, marginBottom: 2 }}>
              {errorMessage}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This window will close automatically. Please try again.
            </Typography>
          </>
        )}
      </Box>
    </>
  )
}

/**
 * Exchange authorization code for access token
 * Makes a POST request to the token endpoint with PKCE code verifier
 *
 * @param code - Authorization code from OAuth provider
 * @param codeVerifier - PKCE code verifier for security
 * @returns Token response with access_token and expires_in
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<{ access_token: string; expires_in: number; token_type: string }> {
  // @todo: remove this after testing
  const tokenUrl = 'https://api.hypernative.xyz/oauth/token'
  const { clientId } = HYPERNATIVE_OAUTH_CONFIG
  // const { tokenUrl, clientId } = HYPERNATIVE_OAUTH_CONFIG

  // Get redirect URI (must match the one used in authorization request)
  const redirectUri = getRedirectUri()

  // Build token exchange request body (JSON format per Hypernative API spec)
  const body = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  }

  // Make token exchange request
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`)
  }

  const { data } = await response.json() // @todo: use response type

  // Validate response structure
  if (!data.access_token || !data.expires_in) {
    throw new Error('Invalid token response: missing access_token or expires_in')
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    token_type: data.token_type || 'Bearer',
  }
}

export default HypernativeOAuthCallback
