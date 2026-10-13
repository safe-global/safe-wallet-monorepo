/**
 * Email sign-in through the local Auth0 of the isolated stack, and the Workspace data such a user starts from.
 */
import { expect, type Page } from '@playwright/test'
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

/** Signs in and waits until the wallet has stored the session, so that a later page load starts signed in. */
export async function signInWithEmail(page: Page, email: string, { secondFactor = true } = {}): Promise<void> {
  const auth0 = await openEmailSignIn(page)
  await auth0.signIn(email, { secondFactor })
  await page.waitForURL((url) => url.hostname === 'localhost' && !url.pathname.startsWith('/cgw'))
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').sessionExpiresAt ?? null,
        `${LS_NAMESPACE}auth`,
      ),
    )
    .not.toBeNull()
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

async function gatewayRequest(page: Page, method: string, path: string, body?: unknown): Promise<unknown> {
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
