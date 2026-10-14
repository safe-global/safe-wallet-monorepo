/**
 * Answers the gateway's Auth0 calls (AUTH0_DOMAIN) in place of a hosted tenant, for email sign-in and step-up.
 *
 * GET /authorize renders a form: an email and a one-time code to sign in, only the code when the gateway asks
 * for a second factor (acr_values). The code is always CODE; any other code shows an error, as Auth0 does.
 * "Sign in without a second factor" issues a token without amr, so the session needs a step-up for sensitive
 * actions. "Do not report the second factor" leaves amr out of a step-up token, which the gateway must refuse.
 * The gateway exchanges the code at /oauth/token, verifies the ID token with /.well-known/jwks.json and reads
 * authenticators through the Management API. Tests and scripts post the same form as the browser.
 */
import { createHash, createPrivateKey, createPublicKey, randomBytes, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { KEYS_DIR, isMain, json, requiredEnv, serveTls } from './http.ts'
import type { HeaderMap, MockRequest, Reply } from './http.ts'
import { signJwt } from './jwt.ts'
import type { Signer } from './jwt.ts'

export const CODE = '123456'
export const CANCELLED = { error: 'access_denied', error_description: 'User has canceled the interaction.' }
export const MFA_ACR = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor'
export const SESSION_COOKIE = 'auth0_session'
const KEY_ID = 'safe-e2e-local'
const TOKEN_LIFETIME_SECONDS = 3600
// The gateway calls https://AUTH0_DOMAIN without a port.
const PORT = 443
const FORM_FIELDS = ['redirect_uri', 'state', 'acr_values', 'ext-enroll-otp']

export type Jwks = { keys: Record<string, string>[] }
type Form = Record<string, string>
type Grant = { email: string; mfa: boolean }
/** `mfa`: the token reports a second factor; `enroll`: the user adds another authenticator. */
type SecondFactor = { mfa: boolean; enroll: boolean }
type AuthenticationMethod = { id: string; type: string; name: string }

function randomToken(): string {
  return randomBytes(24).toString('base64url')
}

/** A stable Auth0-style subject for an email address. */
export function userId(email: string): string {
  return `email|${createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 24)}`
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }
  return value.replace(/[&<>"']/g, (character) => entities[character])
}

function redirect(url: string, params: Form, headers: HeaderMap = {}): Reply {
  const separator = url.includes('?') ? '&' : '?'
  return { status: 302, headers: { Location: url + separator + new URLSearchParams(params), ...headers }, body: '' }
}

function html(status: number, body: string): Reply {
  return { status, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body }
}

function cookieValue(header: string | undefined, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return value.join('=')
  }
  return undefined
}

/** The sign-in or step-up page; `params` carries the authorize request through the form. */
function formPage(params: Form, error?: string): string {
  const elevate = params.acr_values === MFA_ACR
  const hidden = FORM_FIELDS.map(
    (name) => `<input type="hidden" name="${name}" value="${escapeHtml(params[name] ?? '')}">`,
  ).join('')
  const email = elevate ? '' : '<label>Email <input name="email" type="email" required></label>'
  const option = elevate
    ? '<label><input type="checkbox" name="omit_amr"> Do not report the second factor</label>'
    : '<label><input type="checkbox" name="skip_mfa"> Sign in without a second factor</label>'
  const alert = error ? `<p role="alert">${escapeHtml(error)}</p>` : ''
  const title = elevate ? "Verify it's you" : 'Sign in'
  return `<!doctype html><html><head><title>${title}</title></head><body><main>
<h1>${title}</h1>${alert}
<form method="post" action="/authorize">${hidden}
${email}<label>Code <input name="code" inputmode="numeric" autocomplete="one-time-code"></label>
${option}
<button name="action" value="verify">Continue</button>
<button name="action" value="cancel" formnovalidate>Cancel</button>
</form></main></body></html>`
}

export class Auth0 {
  readonly issuer: string
  readonly clientId: string
  readonly clientSecret: string
  readonly signer: Signer
  private readonly codes = new Map<string, Grant>()
  private readonly sessions = new Map<string, string>()
  private readonly managementTokens = new Set<string>()
  private readonly authenticators = new Map<string, AuthenticationMethod[]>()

  constructor(issuer: string, clientId: string, clientSecret: string, signer: Signer) {
    this.issuer = issuer
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.signer = signer
  }

  issueCode(email: string, { mfa, enroll }: SecondFactor): string {
    const code = randomToken()
    this.codes.set(code, { email, mfa })
    if (mfa) {
      const methods = this.authenticators.get(userId(email)) ?? []
      if (enroll || methods.length === 0) {
        methods.push({ id: `totp|${randomBytes(8).toString('hex')}`, type: 'totp', name: 'Authenticator' })
      }
      this.authenticators.set(userId(email), methods)
    }
    return code
  }

  /** Like Auth0's own session cookie: a step-up later knows the user without asking for the email. */
  startSession(email: string): string {
    const session = randomToken()
    this.sessions.set(session, email)
    return session
  }

  sessionEmail(session: string | undefined): string | undefined {
    return session === undefined ? undefined : this.sessions.get(session)
  }

  redeem(code: string): Grant | undefined {
    const grant = this.codes.get(code)
    this.codes.delete(code)
    return grant
  }

  managementToken(): string {
    const token = randomToken()
    this.managementTokens.add(token)
    return token
  }

  isManagementToken(header: string | undefined): boolean {
    return this.managementTokens.has(header?.replace(/^Bearer /, '') ?? '')
  }

  authenticationMethods(user: string): AuthenticationMethod[] {
    return [...(this.authenticators.get(user) ?? [])]
  }

  deleteAuthenticationMethod(user: string, methodId: string): boolean {
    const methods = this.authenticators.get(user) ?? []
    const remaining = methods.filter((method) => method.id !== methodId)
    this.authenticators.set(user, remaining)
    return remaining.length !== methods.length
  }
}

function idToken(auth0: Auth0, { email, mfa }: Grant, now: number): string {
  const claims: Record<string, unknown> = {
    iss: auth0.issuer,
    aud: auth0.clientId,
    sub: userId(email),
    email,
    email_verified: true,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
  }
  if (mfa) claims.amr = ['mfa']
  return signJwt({ alg: 'RS256', typ: 'JWT', kid: KEY_ID }, claims, auth0.signer)
}

function stepUp(form: Form, headers: HeaderMap, auth0: Auth0): Reply {
  const email = auth0.sessionEmail(cookieValue(headers.cookie, SESSION_COOKIE))
  if (email === undefined) return html(200, formPage(form, 'Your session has expired. Sign in again.'))
  const code = auth0.issueCode(email, { mfa: !form.omit_amr, enroll: form['ext-enroll-otp'] === 'true' })
  return redirect(form.redirect_uri, { code, state: form.state ?? '' })
}

function submitAuthorize(form: Form, headers: HeaderMap, auth0: Auth0): Reply {
  const redirectUri = form.redirect_uri ?? ''
  const state = form.state ?? ''
  if (!/^https?:\/\//.test(redirectUri)) return html(400, '<p>Missing redirect_uri</p>')
  if (form.action === 'cancel') return redirect(redirectUri, { ...CANCELLED, state })
  if (form.code !== CODE) return html(200, formPage(form, 'Wrong code. Try again.'))
  if (form.acr_values === MFA_ACR) return stepUp(form, headers, auth0)
  const email = form.email ?? ''
  if (!email.includes('@')) return html(200, formPage(form, 'Enter an email address.'))
  const code = auth0.issueCode(email, { mfa: !form.skip_mfa, enroll: false })
  const cookie = `${SESSION_COOKIE}=${auth0.startSession(email)}; Path=/; Secure; HttpOnly; SameSite=Lax`
  return redirect(redirectUri, { code, state }, { 'Set-Cookie': cookie })
}

function exchangeToken(form: Form, auth0: Auth0): Reply {
  if (form.client_id !== auth0.clientId || form.client_secret !== auth0.clientSecret) {
    return json(401, { error: 'access_denied', error_description: 'Unauthorized' })
  }
  if (form.grant_type === 'client_credentials') {
    return json(200, { access_token: auth0.managementToken(), expires_in: 86400, token_type: 'Bearer' })
  }
  if (form.grant_type !== 'authorization_code') return json(400, { error: 'unsupported_grant_type' })
  const grant = auth0.redeem(form.code ?? '')
  if (grant === undefined) return json(403, { error: 'invalid_grant', error_description: 'Invalid authorization code' })
  return json(200, {
    access_token: randomToken(),
    id_token: idToken(auth0, grant, Math.floor(Date.now() / 1000)),
    token_type: 'Bearer',
    expires_in: TOKEN_LIFETIME_SECONDS,
  })
}

function management(method: string, path: string, headers: HeaderMap, auth0: Auth0): Reply {
  if (!auth0.isManagementToken(headers.authorization)) return json(401, { message: 'Invalid Management API token' })
  const [user, resource, methodId, ...rest] = path.slice('/api/v2/users/'.length).split('/')
  const userKey = decodeURIComponent(user)
  if (resource === 'authentication-methods' && rest.length === 0) {
    if (method === 'GET' && methodId === undefined) return json(200, auth0.authenticationMethods(userKey))
    if (method === 'DELETE' && methodId !== undefined) {
      const found = auth0.deleteAuthenticationMethod(userKey, decodeURIComponent(methodId))
      return found ? { status: 204, headers: {}, body: '' } : json(404, { message: 'Authentication method not found' })
    }
  }
  return json(404, { message: `The local Auth0 does not support ${method} ${path}` })
}

/** Returns the reply to an Auth0 request; request headers have lower-case names. */
export function dispatch(
  request: Pick<MockRequest, 'method' | 'path' | 'query' | 'headers' | 'body'>,
  auth0: Auth0,
  jwks: Jwks,
): Reply {
  const { method, path, query, headers } = request
  const form: Form = Object.fromEntries(new URLSearchParams(request.body))
  if (method === 'GET' && path === '/health') return json(200, { ready: true })
  if (method === 'GET' && path === '/.well-known/jwks.json') return json(200, jwks)
  if (method === 'GET' && path === '/authorize') return html(200, formPage(Object.fromEntries(query)))
  if (method === 'POST' && path === '/authorize') return submitAuthorize(form, headers, auth0)
  if (method === 'POST' && path === '/oauth/token') return exchangeToken(form, auth0)
  if (method === 'GET' && path === '/v2/logout') {
    return { status: 302, headers: { Location: query.get('returnTo') ?? '/' }, body: '' }
  }
  if (path.startsWith('/api/v2/users/')) return management(method, path, headers, auth0)
  return json(404, { message: `The local Auth0 does not support ${method} ${path}` })
}

/** Signs with the mock's RSA key and publishes its public half as the JWKS. */
export function rs256(privateKeyPem: string | Buffer): { signer: Signer; jwks: Jwks } {
  const key = createPrivateKey(privateKeyPem)
  const { n, e } = createPublicKey(key).export({ format: 'jwk' })
  if (!n || !e) throw new Error('The Auth0 signing key is not an RSA key')
  return {
    signer: (message) => sign('sha256', message, key),
    jwks: { keys: [{ kty: 'RSA', kid: KEY_ID, use: 'sig', alg: 'RS256', n, e }] },
  }
}

if (isMain(import.meta.url)) {
  const issuer = `https://${requiredEnv('AUTH0_DOMAIN')}/`
  const { signer, jwks } = rs256(readFileSync(`${KEYS_DIR}/auth0-signing-key.pem`))
  const auth0 = new Auth0(issuer, requiredEnv('AUTH0_CLIENT_ID'), requiredEnv('AUTH0_CLIENT_SECRET'), signer)
  serveTls(PORT, (request) => dispatch(request, auth0, jwks))
  console.error(`Local Auth0 for ${issuer}`)
}
