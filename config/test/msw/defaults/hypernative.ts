import { http, HttpResponse } from 'msw'

/**
 * Hypernative mocks served to every test via the global msw server: the
 * targeted-messaging allowlist and the OAuth token exchange for the mock
 * token URL. Consumed by the hypernative feature suites and
 * apps/web/src/tests/msw/hypernative-oauth-handler.test.ts.
 */
export const hypernativeHandlers = (GATEWAY_URL: string) => [
  // Mock targeted-messaging endpoint for Hypernative (outreachId: 11)
  http.get<{ outreachId: string; chainId: string; safeAddress: string }>(
    `${GATEWAY_URL}/v1/targeted-messaging/outreaches/:outreachId/chains/:chainId/safes/:safeAddress`,
    ({ params }) => {
      const { outreachId, chainId, safeAddress } = params

      // List of Safe addresses that should be considered "targeted" for Hypernative
      // Add your test Safe addresses here (use lowercase for comparison)
      const targetedSafes = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        '0x8f02c3d4a63b2fe436762c807eff182d35df721f',
      ]

      const isTargeted = targetedSafes.some((addr) => addr.toLowerCase() === safeAddress.toLowerCase())

      if (isTargeted && outreachId === '11') {
        return HttpResponse.json({
          outreachId: Number(outreachId),
          address: safeAddress,
        })
      }

      // Return 404 for non-targeted Safes (matches backend behavior)
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
    },
  ),

  // Mock Hypernative OAuth token exchange endpoint
  // This handles the OAuth authorization code exchange for access tokens
  // Used in development and testing when NEXT_PUBLIC_HYPERNATIVE_TOKEN_URL is set to mock URL
  // Per Hypernative API spec: accepts JSON body, returns 600s expiry, read-only scope
  http.post('https://mock-hn-auth.example.com/oauth/token', async ({ request }) => {
    const body = (await request.json()) as {
      grant_type?: string
      code?: string
      code_verifier?: string
      redirect_uri?: string
      client_id?: string
    }

    const grantType = body?.grant_type
    const code = body?.code
    const codeVerifier = body?.code_verifier
    const redirectUri = body?.redirect_uri
    const clientId = body?.client_id

    // Validate required OAuth parameters
    if (!grantType || grantType !== 'authorization_code') {
      return HttpResponse.json({ error: 'invalid_grant', error_description: 'Invalid grant type' }, { status: 400 })
    }

    if (!code) {
      return HttpResponse.json({ error: 'invalid_request', error_description: 'Missing code' }, { status: 400 })
    }

    if (!codeVerifier) {
      return HttpResponse.json(
        { error: 'invalid_request', error_description: 'Missing PKCE code_verifier' },
        { status: 400 },
      )
    }

    if (!redirectUri) {
      return HttpResponse.json({ error: 'invalid_request', error_description: 'Missing redirect_uri' }, { status: 400 })
    }

    if (!clientId || clientId !== 'SAFE_WALLET_WEB') {
      return HttpResponse.json({ error: 'invalid_client', error_description: 'Invalid client_id' }, { status: 401 })
    }

    // Return successful token response per Hypernative spec
    // Hypernative API wraps the OAuth token response in a `data` object
    return HttpResponse.json({
      data: {
        access_token: `mock-hn-token-${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 600,
        scope: 'read',
      },
    })
  }),
]
