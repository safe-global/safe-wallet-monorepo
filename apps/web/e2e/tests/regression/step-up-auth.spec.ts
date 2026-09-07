import type { Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { LS_NAMESPACE } from '../../src/data/constants'

/**
 * When a sensitive action needs a fresh second factor, the user is sent to Auth0,
 * and the state of the action they were trying to perform has to be preserved
 * until they come back. That state is kept in sessionStorage. There are many ways
 * for it to become corrupted during this interaction, so this file tests the
 * unhappy paths.
 */

const SIGNER = '0x1234567890123456789012345678901234567890'
const SPACE_ID = '00000000-0000-0000-0000-0000000000bb'
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const STEP_UP_KEY = 'oidc_step_up'
const AUTHORIZE_PATTERN = /\/v1\/auth\/oidc\/authorize/

const SPACE = {
  id: 1,
  uuid: SPACE_ID,
  name: 'Step-up Test Workspace',
  status: 'ACTIVE',
  safeCount: 1,
  members: [{ id: 1, role: 'ADMIN', name: 'Admin', status: 'ACTIVE', user: { id: 1, status: 'ACTIVE' } }],
}

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

async function gateSafeRemoval(page: Page): Promise<void> {
  await page.route(/\/v1\/spaces\/[^/]+\/safes$/, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    return route.fulfill({ status: 403, json: { message: 'elevation_required', statusCode: 403 } })
  })
}

async function stubProviderChallengePage(page: Page): Promise<void> {
  await page.route(AUTHORIZE_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body><h1>Provider challenge</h1></body></html>',
    }),
  )
}

async function stubCompletedChallenge(page: Page): Promise<void> {
  await page.route(AUTHORIZE_PATTERN, (route) => {
    const returnUrl = new URL(route.request().url()).searchParams.get('redirect_url')

    return route.fulfill({ status: 302, headers: { location: returnUrl ?? '/' } })
  })
}

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

  test('that it discards the pending action and reports failure when the challenge is abandoned', async ({
    safePage,
  }) => {
    await openRemoveDialog(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()
    await expect(safePage.getByRole('heading', { name: 'Provider challenge' })).toBeVisible()

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
