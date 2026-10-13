/**
 * Email sign-in through the local Auth0 of the isolated stack, and the Workspace data such a user starts from.
 */
import { expect, test, type Browser, type Page } from '@playwright/test'
import { CGW_BASE_URL, LS_NAMESPACE } from '../data/constants'
import { Auth0Page } from '../pages/auth0.page'

export const uniqueEmail = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@safe-e2e.test`

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

/** Signs in and waits until the wallet has stored the session, so that a later page load starts signed in. */
export async function signInWithEmail(page: Page, email: string, { secondFactor = true } = {}): Promise<void> {
  const auth0 = await openEmailSignIn(page)
  await auth0.signIn(email, { secondFactor })
  const origin = walletOrigin()
  await page.waitForURL((url) => url.origin === origin)
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').sessionExpiresAt ?? null,
        `${LS_NAMESPACE}auth`,
      ),
    )
    .not.toBeNull()
}

/**
 * Signs the user in again in a browser session of its own, for test setup through the gateway. Signed in with a second
 * factor, its sensitive calls need no step-up, while the session of the test keeps asking for one.
 */
export async function openEmailSession(browser: Browser, email: string, { secondFactor = true } = {}): Promise<Page> {
  const origin = walletOrigin()
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage()
  const authorize = new URL(`${CGW_BASE_URL}/v1/auth/oidc/authorize`)
  authorize.searchParams.set('redirect_url', `${origin}/welcome/spaces`)
  authorize.searchParams.set('connection', 'email')
  await page.goto(authorize.toString())
  await new Auth0Page(page).signIn(email, { secondFactor })
  await page.waitForURL((url) => url.origin === origin)
  return page
}

type Workspace = { uuid: string; name: string }

/** Calls the gateway from the page, so the session cookie and the app's origin go with the request. */
async function gatewayFetch(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; text: string }> {
  return page.evaluate(
    async ({ url, method, body }) => {
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      return { status: response.status, text: await response.text() }
    },
    { url: `${CGW_BASE_URL}${path}`, method, body },
  )
}

export async function gatewayRequest(page: Page, method: string, path: string, body?: unknown): Promise<unknown> {
  const { status, text } = await gatewayFetch(page, method, path, body)
  if (status >= 400) throw new Error(`${method} ${path} returned ${status}: ${text}`)
  return text ? JSON.parse(text) : undefined
}

export async function createWorkspace(page: Page, name: string): Promise<Workspace> {
  const workspace = await gatewayRequest(page, 'POST', '/v1/spaces', { name })
  if (typeof workspace !== 'object' || workspace === null || !('uuid' in workspace) || !('name' in workspace)) {
    throw new Error(`POST /v1/spaces returned no Workspace: ${JSON.stringify(workspace)}`)
  }
  const created = { uuid: String(workspace.uuid), name: String(workspace.name) }
  // The router guard sends a Workspace URL away until the gateway's (cached) Workspace list contains it.
  await expect
    .poll(async () => JSON.stringify(await gatewayRequest(page, 'GET', '/v1/spaces')), { timeout: 30_000 })
    .toContain(created.uuid)
  return created
}

/** Stores the Workspace's plan in the local billing service, which returns once the gateway has applied it. */
export async function storeSubscription(uuid: string, subscription: { status?: string } = {}): Promise<void> {
  const url = `${new URL(CGW_BASE_URL).origin}/billing/__test/customers/${uuid}/subscriptions`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
  if (!response.ok) throw new Error(`POST ${url} returned ${response.status}: ${await response.text()}`)
}

/** The gateway's answer for a resource of the Workspace (`safes`, `members`, `address-book`), as text. */
export async function workspaceResource(page: Page, uuid: string, resource: string): Promise<string> {
  return JSON.stringify(await gatewayRequest(page, 'GET', `/v1/spaces/${uuid}/${resource}`))
}

export async function workspaceName(page: Page, uuid: string): Promise<string> {
  const workspace = await gatewayRequest(page, 'GET', `/v1/spaces/${uuid}`)
  if (typeof workspace !== 'object' || workspace === null || !('name' in workspace)) {
    throw new Error(`GET /v1/spaces/${uuid} returned no name`)
  }
  return String(workspace.name)
}

/** How the gateway session was signed in (`oidc` for email), or null without a session. */
export async function sessionAuthMethod(page: Page): Promise<string | null> {
  const { status, text } = await gatewayFetch(page, 'GET', '/v1/auth/me')
  if (status === 403) return null
  const session: unknown = JSON.parse(text)
  return typeof session === 'object' && session !== null && 'authMethod' in session ? String(session.authMethod) : null
}
