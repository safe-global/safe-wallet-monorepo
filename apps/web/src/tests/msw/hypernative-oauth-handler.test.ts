import { setupServer } from 'msw/node'
import { handlers } from '@safe-global/test/msw/handlers'
import { GATEWAY_URL } from '@/config/gateway'

// Create a test server with our handlers
const server = setupServer(...handlers(GATEWAY_URL))

describe('Hypernative OAuth Token Exchange Handler', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  const tokenUrl = 'https://mock-hn-auth.example.com/oauth/token'

  const validTokenRequest = {
    grant_type: 'authorization_code',
    code: 'test-auth-code-123',
    code_verifier: 'test-verifier-456',
    redirect_uri: 'http://localhost:3000/hypernative/oauth-callback',
    client_id: 'SAFE_WALLET_WEB',
  }

  it('should return access token for valid request', async () => {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validTokenRequest),
    })

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toMatchObject({
      data: {
        access_token: expect.stringMatching(/^mock-hn-token-\d+$/),
        token_type: 'Bearer',
        expires_in: 600,
      },
    })
  })

  it('should reject request with invalid grant_type', async () => {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validTokenRequest,
        grant_type: 'client_credentials',
      }),
    })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data).toEqual({
      error: 'invalid_grant',
      error_description: 'Invalid grant type',
    })
  })

  it('should reject request with missing code', async () => {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: validTokenRequest.grant_type,
        code_verifier: validTokenRequest.code_verifier,
        redirect_uri: validTokenRequest.redirect_uri,
        client_id: validTokenRequest.client_id,
      }),
    })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data).toEqual({
      error: 'invalid_request',
      error_description: 'Missing code',
    })
  })

  it('should reject request with missing code_verifier', async () => {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: validTokenRequest.grant_type,
        code: validTokenRequest.code,
        redirect_uri: validTokenRequest.redirect_uri,
        client_id: validTokenRequest.client_id,
      }),
    })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data).toEqual({
      error: 'invalid_request',
      error_description: 'Missing PKCE code_verifier',
    })
  })

  it('should reject request with missing redirect_uri', async () => {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: validTokenRequest.grant_type,
        code: validTokenRequest.code,
        code_verifier: validTokenRequest.code_verifier,
        client_id: validTokenRequest.client_id,
      }),
    })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data).toEqual({
      error: 'invalid_request',
      error_description: 'Missing redirect_uri',
    })
  })

  it('should reject request with invalid client_id', async () => {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validTokenRequest,
        client_id: 'wrong-client-id',
      }),
    })

    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data).toEqual({
      error: 'invalid_client',
      error_description: 'Invalid client_id',
    })
  })

  it('should reject request with missing client_id', async () => {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: validTokenRequest.grant_type,
        code: validTokenRequest.code,
        code_verifier: validTokenRequest.code_verifier,
        redirect_uri: validTokenRequest.redirect_uri,
      }),
    })

    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data).toEqual({
      error: 'invalid_client',
      error_description: 'Invalid client_id',
    })
  })

  it('should generate unique tokens for each request', async () => {
    const response1 = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validTokenRequest),
    })

    const data1 = await response1.json()

    // Wait a moment to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10))

    const response2 = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validTokenRequest),
    })

    const data2 = await response2.json()

    expect(data1.data.access_token).not.toBe(data2.data.access_token)
  })
})
