/**
 * Email sessions of the local Auth0 of the isolated stack, and the Workspace data such a user starts from.
 */
import { expect, request, test, type APIResponse, type BrowserContext, type Page } from '@playwright/test'
import { CGW_BASE_URL, CHAIN_IDS, LS_NAMESPACE } from '../data/constants'
import { AUTH0_CODE, Auth0Page } from '../pages/auth0.page'

/** The gateway sends browsers here; playwright.isolated.config.ts maps the name to the published port of the mock. */
const AUTH0_HOST = 'auth.safe-e2e.test'
const AUTH0_MOCK_URL = `https://127.0.0.1:${process.env.AUTH0_MOCK_PORT || '8443'}`
const GATEWAY_SESSION_COOKIE = 'access_token'
const AUTH0_SESSION_COOKIE = 'auth0_session'
// SESSION_LIFETIME_MS of the wallet's authSlice, which imports too much of the app to load here.
const WALLET_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000

type Cookie = Parameters<BrowserContext['addCookies']>[0][number]

/** A signed-in user: the gateway's session cookie, and the local Auth0's, which a step-up reads the email from. */
export type EmailSession = { email: string; cookies: Cookie[] }

export const uniqueEmail = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@safe-e2e.test`

// The return from Auth0 is a page load: the app boots again behind its launch screen.
export const launchScreen = (page: Page) => page.getByTestId('launch-screen')

/** The URL of a Workspace page, with nothing after the Workspace. */
export const workspaceUrl = (path: string, workspaceId: string): RegExp =>
  new RegExp(`${path}\\?spaceId=${workspaceId}$`)

/** Starts the email sign-in from the Workspace welcome page and stops on the local Auth0 page. */
export async function openEmailSignIn(page: Page): Promise<Auth0Page> {
  await page.goto('/welcome/spaces')
  await page.getByRole('button', { name: 'Continue with email' }).click()
  const auth0 = new Auth0Page(page)
  await auth0.signInHeading.waitFor()
  return auth0
}

function walletOrigin(): string {
  const { baseURL } = test.info().project.use
  if (!baseURL) throw new Error('The email sign-in needs the baseURL of the wallet')
  return new URL(baseURL).origin
}

function toSameSite(value: string): Cookie['sameSite'] {
  const sameSite = { none: 'None', lax: 'Lax', strict: 'Strict' } as const
  const key = value.toLowerCase()
  return key in sameSite ? sameSite[key as keyof typeof sameSite] : undefined
}

/** The named cookie of a response, for the browser to keep under `domain`. */
function responseCookie(response: APIResponse, name: string, domain: string): Cookie {
  const header = response
    .headersArray()
    .filter(({ name: header }) => header.toLowerCase() === 'set-cookie')
    .map(({ value }) => value)
    .find((value) => value.startsWith(`${name}=`))
  if (!header) throw new Error(`${response.url()} set no ${name} cookie`)
  const [pair, ...attributes] = header.split(';').map((part) => part.trim())
  const cookie: Cookie = { name, value: pair.slice(name.length + 1), domain, path: '/' }
  for (const attribute of attributes) {
    const [key, value = ''] = attribute.split('=')
    if (key.toLowerCase() === 'httponly') cookie.httpOnly = true
    if (key.toLowerCase() === 'secure') cookie.secure = true
    if (key.toLowerCase() === 'samesite') cookie.sameSite = toSameSite(value)
  }
  return cookie
}

function redirectTarget(response: APIResponse): string {
  const location = response.headers()['location']
  if (response.status() !== 302 || !location) {
    throw new Error(`${response.url()} answered ${response.status()} instead of a redirect`)
  }
  return location
}

/**
 * Signs in through the gateway and the local Auth0 without a browser, so a test can open its page signed in. The
 * gateway mints the session as it does for a browser; with `secondFactor: false`, its sensitive calls need a step-up.
 */
export async function createEmailSession(email: string, { secondFactor = true } = {}): Promise<EmailSession> {
  // The mock's certificate is self-signed, as for the browser (`ignoreHTTPSErrors` in playwright.isolated.config.ts).
  const api = await request.newContext({ ignoreHTTPSErrors: true, maxRedirects: 0 })
  try {
    const authorize = new URL(`${CGW_BASE_URL}/v1/auth/oidc/authorize`)
    authorize.searchParams.set('redirect_url', `${walletOrigin()}/welcome/spaces`)
    authorize.searchParams.set('connection', 'email')
    const auth0Url = new URL(redirectTarget(await api.get(authorize.toString())))
    // Node cannot resolve the mock's name, so the form goes to its published port under that name.
    const signIn = await api.post(`${AUTH0_MOCK_URL}/authorize`, {
      headers: { Host: AUTH0_HOST },
      form: {
        ...Object.fromEntries(auth0Url.searchParams),
        email,
        code: AUTH0_CODE,
        action: 'verify',
        ...(secondFactor ? {} : { skip_mfa: 'on' }),
      },
    })
    const callback = await api.get(redirectTarget(signIn))
    redirectTarget(callback)
    return {
      email,
      cookies: [
        responseCookie(callback, GATEWAY_SESSION_COOKIE, new URL(CGW_BASE_URL).hostname),
        responseCookie(signIn, AUTH0_SESSION_COOKIE, AUTH0_HOST),
      ],
    }
  } finally {
    await api.dispose()
  }
}

/** Starts the page signed in, as the wallet keeps a session: the cookies, and the expiry in its stored auth state. */
export async function signInWithEmail(page: Page, email: string, { secondFactor = true } = {}): Promise<EmailSession> {
  const session = await createEmailSession(email, { secondFactor })
  await page.context().addCookies(session.cookies)
  const auth = {
    sessionExpiresAt: Date.now() + WALLET_SESSION_LIFETIME_MS,
    landingSpaceHint: null,
    isStoreHydrated: false,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  }
  // Only into an empty store: the script runs on every page load, also after the return from a step-up.
  await page.addInitScript(
    ({ key, value }) => {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value)
    },
    { key: `${LS_NAMESPACE}auth`, value: JSON.stringify(auth) },
  )
  return session
}

type Workspace = { uuid: string; name: string }

/** Calls the gateway with the session's cookie; a session with a second factor needs no step-up. */
export async function gatewayRequest(
  session: EmailSession,
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const gatewayHost = new URL(CGW_BASE_URL).hostname
  const cookie = session.cookies
    .filter(({ domain }) => domain === gatewayHost)
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')
  const response = await fetch(`${CGW_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${path} returned ${response.status}: ${text}`)
  return text ? JSON.parse(text) : undefined
}

export async function createWorkspace(session: EmailSession, name: string): Promise<Workspace> {
  const workspace = await gatewayRequest(session, 'POST', '/v1/spaces', { name })
  if (typeof workspace !== 'object' || workspace === null || !('uuid' in workspace) || !('name' in workspace)) {
    throw new Error(`POST /v1/spaces returned no Workspace: ${JSON.stringify(workspace)}`)
  }
  const created = { uuid: String(workspace.uuid), name: String(workspace.name) }
  // The router guard sends a Workspace URL away until the gateway's (cached) Workspace list contains it.
  await expect
    .poll(async () => JSON.stringify(await gatewayRequest(session, 'GET', '/v1/spaces')), { timeout: 30_000 })
    .toContain(created.uuid)
  return created
}

/** Adds Sepolia Safes to the Workspace through the gateway. */
export async function addWorkspaceSafes(
  session: EmailSession,
  workspaceId: string,
  addresses: string[],
): Promise<void> {
  await gatewayRequest(session, 'POST', `/v1/spaces/${workspaceId}/safes`, {
    safes: addresses.map((address) => ({ chainId: CHAIN_IDS.sepolia, address })),
  })
}

const billingSubscriptionsUrl = (uuid: string): string =>
  `${new URL(CGW_BASE_URL).origin}/billing/__test/customers/${uuid}/subscriptions`

const offersTrial = async (session: EmailSession, uuid: string): Promise<boolean> => {
  const links = await gatewayRequest(session, 'GET', `/v1/billing/spaces/${uuid}/payment-links`)
  return Array.isArray(links) && links.some((link: { trialPeriodDays?: number | null }) => link.trialPeriodDays != null)
}

/**
 * Stores the Workspace's plan in the local billing service, and waits until the gateway has applied the webhook:
 * a Workspace that had a plan is offered no trial.
 */
export async function storeSubscription(
  session: EmailSession,
  uuid: string,
  subscription: { plan?: 'business' | 'starter'; status?: string } = {},
): Promise<void> {
  const url = billingSubscriptionsUrl(uuid)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
  if (!response.ok) throw new Error(`POST ${url} returned ${response.status}: ${await response.text()}`)
  await expect.poll(() => offersTrial(session, uuid)).toBe(false)
}

/** Leaves a Workspace the gateway has not read yet without a plan, as every new Workspace is in production. */
export async function removeSubscription(uuid: string): Promise<void> {
  const url = billingSubscriptionsUrl(uuid)
  const response = await fetch(url, { method: 'DELETE' })
  if (!response.ok) throw new Error(`DELETE ${url} returned ${response.status}: ${await response.text()}`)
}

/** The name of the Workspace's plan, as the gateway reports it; null without a subscription. */
export async function planName(session: EmailSession, uuid: string): Promise<string | null> {
  const subscriptions = await gatewayRequest(session, 'GET', `/v1/billing/spaces/${uuid}/subscriptions`)
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) return null
  const [{ metadata }] = subscriptions as Array<{ metadata?: { planName?: string } }>
  return metadata?.planName ?? null
}

/** Sponsored transactions the Workspace spent in the current cycle, as the gateway counts them; null without the meter. */
export async function sponsoredTransactionsUsed(session: EmailSession, uuid: string): Promise<number | null> {
  const response = await gatewayRequest(session, 'GET', `/v1/spaces/${uuid}/entitlements`)
  const entitlements = (response as { entitlements?: Array<{ feature?: string; used?: number }> })?.entitlements
  return entitlements?.find(({ feature }) => feature === 'sponsored_transactions')?.used ?? null
}

/** The gateway's answer for a resource of the Workspace (`safes`, `members`, `address-book`), as text. */
export async function workspaceResource(session: EmailSession, uuid: string, resource: string): Promise<string> {
  return JSON.stringify(await gatewayRequest(session, 'GET', `/v1/spaces/${uuid}/${resource}`))
}

export async function workspaceName(session: EmailSession, uuid: string): Promise<string> {
  const workspace = await gatewayRequest(session, 'GET', `/v1/spaces/${uuid}`)
  if (typeof workspace !== 'object' || workspace === null || !('name' in workspace)) {
    throw new Error(`GET /v1/spaces/${uuid} returned no name`)
  }
  return String(workspace.name)
}

/** The membership status (`INVITED`, `ACTIVE`, …) of the user with `email` in the Workspace, or null when not listed. */
export async function memberStatus(session: EmailSession, uuid: string, email: string): Promise<string | null> {
  const response = await gatewayRequest(session, 'GET', `/v1/spaces/${uuid}/members`)
  if (
    typeof response !== 'object' ||
    response === null ||
    !('members' in response) ||
    !Array.isArray(response.members)
  ) {
    throw new Error(`GET /v1/spaces/${uuid}/members returned no members`)
  }
  const member: unknown = response.members.find(
    (entry: unknown) =>
      typeof entry === 'object' &&
      entry !== null &&
      'user' in entry &&
      typeof entry.user === 'object' &&
      entry.user !== null &&
      'email' in entry.user &&
      entry.user.email === email,
  )
  return typeof member === 'object' && member !== null && 'status' in member ? String(member.status) : null
}

/** How the browser's gateway session was signed in (`oidc` for email), or null without a session. */
export async function sessionAuthMethod(page: Page): Promise<string | null> {
  const { status, text } = await page.evaluate(async (url) => {
    const response = await fetch(url, { credentials: 'include' })
    return { status: response.status, text: await response.text() }
  }, `${CGW_BASE_URL}/v1/auth/me`)
  if (status === 403) return null
  const session: unknown = JSON.parse(text)
  return typeof session === 'object' && session !== null && 'authMethod' in session ? String(session.authMethod) : null
}
