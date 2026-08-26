import type { Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { LS_NAMESPACE } from '../../src/data/constants'

/**
 * Step-up (elevation) auth: what happens around the round-trip to the provider.
 *
 * These live in a browser because the whole defect class is the page lifecycle —
 * a page frozen in the back-forward cache, a full navigation away and back, and
 * `sessionStorage` outliving both. The storage helpers themselves are unit-tested;
 * none of that can reproduce a bfcache restore.
 *
 * Both stubs below are the sanctioned kind: `FF_MFA_STEP_UP` is off on staging, so
 * a `403 elevation_required` is a state the real API cannot produce, and the
 * provider's hosted OTP page cannot be driven from a test. Completing a real
 * challenge stays manual — it needs a live authenticator.
 */

const SIGNER = '0x1234567890123456789012345678901234567890'
const SPACE_ID = '00000000-0000-0000-0000-0000000000bb'
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const STEP_UP_KEY = 'oidc_step_up'
const AUTHORIZE_PATTERN = /\/v1\/auth\/oidc\/authorize/

// Shape mirrors the proven spaces pattern: the pages gate on membership, so an
// ADMIN member has to be present or the app redirects to /welcome/spaces.
const SPACE = {
  id: 1,
  uuid: SPACE_ID,
  name: 'Step-up Test Workspace',
  status: 'ACTIVE',
  safeCount: 1,
  members: [{ id: 1, role: 'ADMIN', name: 'Admin', status: 'ACTIVE', user: { id: 1, status: 'ACTIVE' } }],
}

/** Minimum session + spaces mocks for the workspace pages to render. */
async function seedWorkspaceSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ ns, spaceId }) => {
      window.localStorage.setItem(
        `${ns}auth`,
        JSON.stringify({
          sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
          lastUsedSpace: spaceId,
          isStoreHydrated: false,
          cfSafeSynced: false,
          isOidcLoginPending: false,
        }),
      )
    },
    { ns: LS_NAMESPACE, spaceId: SPACE_ID },
  )

  await page.route(/\/v1\/auth\/me(\?.*)?$/, (route) =>
    route.fulfill({ json: { id: '1', authMethod: 'siwe', signerAddress: SIGNER } }),
  )
  await page.route(/\/v1\/users(\?.*)?$/, (route) =>
    route.fulfill({ json: { id: 1, status: 1, wallets: [{ id: 1, address: SIGNER }] } }),
  )
  await page.route(/\/v1\/spaces\/[^/]+\/members(\?.*)?$/, (route) =>
    route.fulfill({ json: { members: SPACE.members } }),
  )
  await page.route(/\/v1\/spaces\/[^/]+\/safes(\?.*)?$/, (route) =>
    route.fulfill({ json: { safes: { '1': [SAFE_ADDRESS] } } }),
  )
  await page.route(/\/v1\/spaces\/[^/]+(\?.*)?$/, (route) => route.fulfill({ json: SPACE }))
  await page.route(/\/v1\/spaces(\?.*)?$/, (route) => route.fulfill({ json: [SPACE] }))
}

/** The gated route answers as CGW's ElevationGuard does when the session lacks a fresh factor. */
async function gateSafeRemoval(page: Page): Promise<void> {
  await page.route(/\/v1\/spaces\/[^/]+\/safes$/, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    return route.fulfill({ status: 403, json: { message: 'elevation_required', statusCode: 403 } })
  })
}

/**
 * Stands in for the provider's hosted page and *stays* there, so the tests can
 * act on "the user is sitting on the challenge" — backing out of it, or walking
 * away from it. Without this the browser follows CGW's redirect to the real
 * Auth0 tenant, which is neither reachable nor stable from a test.
 */
async function stubProviderChallengePage(page: Page): Promise<void> {
  await page.route(AUTHORIZE_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body><h1>Provider challenge</h1></body></html>',
    }),
  )
}

/** Stands in for a *completed* challenge: bounces straight back to the app's return URL. */
async function stubCompletedChallenge(page: Page): Promise<void> {
  await page.route(AUTHORIZE_PATTERN, (route) => {
    const returnUrl = new URL(route.request().url()).searchParams.get('redirect_url')

    return route.fulfill({ status: 302, headers: { location: returnUrl ?? '/' } })
  })
}

/** The elevate request itself is the assertion target — where the provider sends the user afterwards is its business. */
function captureAuthorizeRequest(page: Page) {
  return page.waitForRequest((request) => AUTHORIZE_PATTERN.test(request.url()))
}

async function openRemoveDialog(page: Page): Promise<void> {
  await page.goto(`/spaces/safe-accounts?spaceId=${SPACE_ID}`)
  await page.getByRole('button', { name: 'Safe Account actions' }).first().click()
  await page.getByRole('menuitem', { name: 'Remove from workspace' }).click()
}

const readStepUpRecord = (page: Page) => page.evaluate((key) => window.sessionStorage.getItem(key), STEP_UP_KEY)

test.describe('Step-up auth round-trip', { tag: '@regression' }, () => {
  test.beforeEach(async ({ safePage }) => {
    await seedWorkspaceSession(safePage)
    await gateSafeRemoval(safePage)
    // Never reach the real tenant. Tests that need a *completed* challenge
    // register `stubCompletedChallenge` afterwards, which takes precedence.
    await stubProviderChallengePage(safePage)
  })

  test('that it sends the user to the provider when an action needs a fresh second factor', async ({ safePage }) => {
    await openRemoveDialog(safePage)

    const authorizeRequest = captureAuthorizeRequest(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()

    const url = new URL((await authorizeRequest).url())
    expect(url.searchParams.get('elevate')).toBe('true')
    expect(url.searchParams.get('redirect_url')).toContain('/spaces/safe-accounts')
  })

  // A leftover record must not suppress the next redirect: that leaves the
  // tab was dead for step-up until it was closed. Backing out of the challenge
  // page is how a user reaches that state — the browser restores the frozen page
  // and nothing consumes the record — but bfcache cannot be driven from a test
  // (this app holds connections that disqualify it), so the residue is planted
  // directly after load instead. What matters is the invariant: nothing that
  // outlives a page load may block a redirect.
  test('that it still redirects when a leftover trip record is present', async ({ safePage }) => {
    await openRemoveDialog(safePage)

    await safePage.evaluate(
      ({ key, spaceId, address }) => {
        window.sessionStorage.setItem(
          key,
          JSON.stringify({
            endpoint: 'spaceSafesDeleteV1',
            args: { spaceId, deleteSpaceSafesDto: { safes: [{ chainId: '1', address }] } },
            createdAt: Date.now(),
          }),
        )
      },
      { key: STEP_UP_KEY, spaceId: SPACE_ID, address: SAFE_ADDRESS },
    )

    const authorizeRequest = captureAuthorizeRequest(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()

    expect(new URL((await authorizeRequest).url()).searchParams.get('elevate')).toBe('true')
  })

  // Regression: the pending marker and the payload lived in separate keys, so a
  // return could consume one and strand the other for an unrelated round-trip to
  // execute — a deletion nobody pressed at that moment.
  test('that it discards the pending action and reports failure when the challenge is abandoned', async ({
    safePage,
  }) => {
    await openRemoveDialog(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()
    await expect(safePage.getByRole('heading', { name: 'Provider challenge' })).toBeVisible()

    // Abandon: walk back into the app without completing the challenge.
    await safePage.goto(`/spaces/safe-accounts?spaceId=${SPACE_ID}`)

    await expect(safePage.getByRole('alert')).toContainText('Verification was not completed')
    await expect.poll(() => readStepUpRecord(safePage)).toBeNull()
  })

  test('that it ignores a pending action older than the challenge window', async ({ safePage }) => {
    await safePage.addInitScript(
      ({ key, address, spaceId }) => {
        window.sessionStorage.setItem(
          key,
          JSON.stringify({
            endpoint: 'spaceSafesDeleteV1',
            args: { spaceId, deleteSpaceSafesDto: { safes: [{ chainId: '1', address }] } },
            // Older than the 5-minute window the provider's own state cookie allows.
            createdAt: Date.now() - 6 * 60 * 1000,
          }),
        )
      },
      { key: STEP_UP_KEY, address: SAFE_ADDRESS, spaceId: SPACE_ID },
    )

    let replayAttempted = false
    await safePage.route(/\/v1\/spaces\/[^/]+\/safes$/, async (route) => {
      if (route.request().method() === 'DELETE') replayAttempted = true
      return route.fallback()
    })

    await safePage.goto(`/spaces/safe-accounts?spaceId=${SPACE_ID}`)
    await expect(safePage.getByRole('button', { name: 'Add accounts' })).toBeVisible()

    await expect.poll(() => readStepUpRecord(safePage)).toBeNull()
    expect(replayAttempted).toBe(false)
  })

  test('that it completes the interrupted action when the challenge succeeds', async ({ safePage }) => {
    await stubCompletedChallenge(safePage)

    // The gate lifts once the provider has been through: the replay must succeed.
    let removalCalls = 0
    await safePage.route(/\/v1\/spaces\/[^/]+\/safes$/, async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback()

      removalCalls += 1
      return removalCalls === 1
        ? route.fulfill({ status: 403, json: { message: 'elevation_required', statusCode: 403 } })
        : route.fulfill({ status: 204, body: '' })
    })

    await openRemoveDialog(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()

    await expect(safePage.getByRole('alert')).toContainText('Safe account removed')
    expect(removalCalls).toBe(2)
    await expect.poll(() => readStepUpRecord(safePage)).toBeNull()
  })

  test('that it reports an error when the replayed action fails', async ({ safePage }) => {
    await stubCompletedChallenge(safePage)

    let removalCalls = 0
    await safePage.route(/\/v1\/spaces\/[^/]+\/safes$/, async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback()

      removalCalls += 1
      return removalCalls === 1
        ? route.fulfill({ status: 403, json: { message: 'elevation_required', statusCode: 403 } })
        : route.fulfill({ status: 500, json: { message: 'Internal error', statusCode: 500 } })
    })

    await openRemoveDialog(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()

    await expect(safePage.getByRole('alert')).toBeVisible()
    await expect.poll(() => readStepUpRecord(safePage)).toBeNull()
  })
})
