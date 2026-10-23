import type { Page } from '@playwright/test'
import type { AuthGetMeV1ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import type {
  BillingGetSpacePaymentLinksV1ApiResponse,
  BillingGetSubscriptionsV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { CounterfactualSafesGetV1ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import type { EntitlementsGetEntitlementsV1ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import type {
  AddressBooksGetAddressBookItemsV1ApiResponse,
  MembersGetMembershipV1ApiResponse,
  MembersGetUsersV1ApiResponse,
  SpaceCounterfactualSafesGetV1ApiResponse,
  SpaceSafesGetV1ApiResponse,
  SpacesGetOneV1ApiResponse,
  SpacesGetV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UsersGetWithWalletsV1ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { test, expect } from '../../src/fixtures/test.fixture'
import { clickVerify, expectActionCompleted, stepUpDialog } from '../../src/fixtures/step-up'
import { LS_NAMESPACE } from '../../src/data/constants'

/**
 * The browser side of a step-up, with the gateway and Auth0 mocked: the popup ends on the static completion page,
 * which reports to the wallet tab over a BroadcastChannel; and a browser that blocks the popup gets a same-tab
 * verification. The isolated specs cover the real Auth0 round-trip.
 */

const SIGNER = '0x1234567890123456789012345678901234567890'
const CHAIN_ID = '1'
const SPACE_ID = '00000000-0000-0000-0000-0000000000bb'
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const SAFE_ACCOUNTS_URL = `/spaces/safe-accounts?spaceId=${SPACE_ID}`
const AUTHORIZE_PATTERN = /\/v1\/auth\/oidc\/authorize/
const SPACE_SAFES_PATTERN = /\/v1\/spaces\/[^/]+\/safes$/
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000

const ELEVATION_REQUIRED_RESPONSE = { status: 403, json: { message: ELEVATION_REQUIRED_ERROR, statusCode: 403 } }

const SESSION = { id: '1', authMethod: 'siwe', signerAddress: SIGNER } satisfies AuthGetMeV1ApiResponse

const USER = { id: 1, status: 1, wallets: [{ id: 1, address: SIGNER }] } satisfies UsersGetWithWalletsV1ApiResponse

const MEMBERSHIP = {
  id: 1,
  role: 'ADMIN',
  status: 'ACTIVE',
  name: 'Admin',
  invitedBy: null,
  createdAt: '',
  updatedAt: '',
  user: { id: 1, status: 'ACTIVE', email: null, address: SIGNER },
} satisfies MembersGetMembershipV1ApiResponse

const MEMBERS = { members: [MEMBERSHIP] } satisfies MembersGetUsersV1ApiResponse

const SPACE = {
  uuid: SPACE_ID,
  name: 'Step-up Test Workspace',
  memberCount: 1,
  safeCount: 1,
  experimentalFeatures: [],
  members: [
    { role: 'ADMIN', name: 'Admin', status: 'ACTIVE', invitedBy: null, inviteExpiresAt: null, user: { id: 1 } },
  ],
} satisfies SpacesGetOneV1ApiResponse

const SPACES = [SPACE] satisfies SpacesGetV1ApiResponse

const SPACE_SAFES = { safes: { [CHAIN_ID]: [SAFE_ADDRESS] } } satisfies SpaceSafesGetV1ApiResponse

// Safe Pro locks a Workspace without a live subscription behind a blocking modal.
const LIVE_SUBSCRIPTIONS = [
  {
    id: 'sub_e2e',
    customerId: 'cus_e2e',
    upstreamCustomerId: 'cus_e2e',
    plan: {
      id: 'plan_e2e',
      currentPrice: 0,
      originalPrice: null,
      paymentMethod: 'fiat',
      currency: 'usd',
      features: [],
      type: 'standard',
      product: null,
    },
    status: 'active',
    createdAt: 0,
    startAt: 0,
    cancelledAt: null,
    cancelAt: null,
  },
] satisfies BillingGetSubscriptionsV1ApiResponse

const NO_COUNTERFACTUAL_SAFES = { safes: {} } satisfies CounterfactualSafesGetV1ApiResponse &
  SpaceCounterfactualSafesGetV1ApiResponse

const ENTITLEMENTS = {
  plan: { id: 'plan_e2e', name: 'Business', cycleEndsAt: null, status: 'active' },
  entitlements: [],
} satisfies EntitlementsGetEntitlementsV1ApiResponse

const ADDRESS_BOOK = { spaceUuid: SPACE_ID, data: [] } satisfies AddressBooksGetAddressBookItemsV1ApiResponse

const PAYMENT_LINKS = [] satisfies BillingGetSpacePaymentLinksV1ApiResponse

async function seedWorkspaceSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ ns, spaceId, sessionLifetimeMs }) => {
      window.localStorage.setItem(
        `${ns}auth`,
        JSON.stringify({
          sessionExpiresAt: Date.now() + sessionLifetimeMs,
          landingSpaceHint: spaceId,
          isStoreHydrated: false,
          cfSafeSynced: false,
          isOidcLoginPending: false,
        }),
      )
    },
    { ns: LS_NAMESPACE, spaceId: SPACE_ID, sessionLifetimeMs: SESSION_LIFETIME_MS },
  )

  await page.route(/\/v1\/auth\/me(\?.*)?$/, (route) => route.fulfill({ json: SESSION }))
  await page.route(/\/v1\/users(\?.*)?$/, (route) => route.fulfill({ json: USER }))
  await page.route(/\/v1\/spaces\/[^/]+\/members(\?.*)?$/, (route) => route.fulfill({ json: MEMBERS }))
  await page.route(/\/v1\/spaces\/[^/]+\/safes(\?.*)?$/, (route) => route.fulfill({ json: SPACE_SAFES }))
  await page.route(/\/v1\/spaces\/[^/]+(\?.*)?$/, (route) => route.fulfill({ json: SPACE }))
  await page.route(/\/v1\/spaces(\?.*)?$/, (route) => route.fulfill({ json: SPACES }))
  await page.route(/\/v1\/billing\/spaces\/[^/]+\/subscriptions(\?.*)?$/, (route) =>
    route.fulfill({ json: LIVE_SUBSCRIPTIONS }),
  )
  // Session-scoped calls of the Workspace pages; unmocked, the gateway answers 403 and the app re-checks the session.
  await page.route(/\/v1\/users\/counterfactual-safes(\?.*)?$/, (route) =>
    route.fulfill({ json: NO_COUNTERFACTUAL_SAFES }),
  )
  await page.route(/\/v1\/spaces\/[^/]+\/counterfactual-safes(\?.*)?$/, (route) =>
    route.fulfill({ json: NO_COUNTERFACTUAL_SAFES }),
  )
  await page.route(/\/v1\/spaces\/[^/]+\/membership(\?.*)?$/, (route) => route.fulfill({ json: MEMBERSHIP }))
  await page.route(/\/v1\/spaces\/[^/]+\/entitlements(\?.*)?$/, (route) => route.fulfill({ json: ENTITLEMENTS }))
  await page.route(/\/v1\/spaces\/[^/]+\/address-book(\?.*)?$/, (route) => route.fulfill({ json: ADDRESS_BOOK }))
  await page.route(/\/v1\/billing\/spaces\/[^/]+\/payment-links(\?.*)?$/, (route) =>
    route.fulfill({ json: PAYMENT_LINKS }),
  )
}

/** Rejects the first removals with `elevation_required` and accepts the rest; returns the number of removals sent. */
async function gateSafeRemoval(page: Page, rejections = 1): Promise<() => number> {
  let removals = 0
  await page.route(SPACE_SAFES_PATTERN, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    removals += 1
    return removals <= rejections
      ? route.fulfill(ELEVATION_REQUIRED_RESPONSE)
      : route.fulfill({ status: 200, body: '' })
  })
  return () => removals
}

/** The gateway sends a completed challenge to its `redirect_url`; the popup is a new page, so the route is the context's. */
async function stubCompletedChallenge(page: Page): Promise<void> {
  await page.context().route(AUTHORIZE_PATTERN, (route) => {
    const returnUrl = new URL(route.request().url()).searchParams.get('redirect_url')

    return route.fulfill({ status: 302, headers: { location: returnUrl ?? '/' } })
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

async function removeSafe(page: Page): Promise<void> {
  await page.goto(SAFE_ACCOUNTS_URL)
  await page.getByRole('button', { name: 'Safe Account actions' }).first().click()
  await page.getByRole('menuitem', { name: 'Remove from Workspace' }).click()
  await page.getByRole('button', { name: 'Remove' }).click()
}

test.describe('Step-up auth in a popup', { tag: '@regression' }, () => {
  test.beforeEach(async ({ safePage }) => {
    await seedWorkspaceSession(safePage)
  })

  test('that the request is sent again once the popup reports the verification', async ({ safePage }) => {
    const removals = await gateSafeRemoval(safePage)
    await stubCompletedChallenge(safePage)

    await removeSafe(safePage)
    const popup = await clickVerify(safePage)
    // The mocked challenge ends at once, so the popup can close before a 'close' listener exists.
    await expect.poll(() => popup.isClosed()).toBe(true)

    await expectActionCompleted(safePage, new RegExp(`/spaces/safe-accounts\\?spaceId=${SPACE_ID}$`))
    await expect(safePage.getByRole('alert').filter({ hasText: 'Removed safe account from space' })).toBeVisible()
    expect(removals()).toBe(2)
  })

  test('that a blocked popup offers the verification in the same tab', async ({ safePage }) => {
    const removals = await gateSafeRemoval(safePage)
    await stubProviderChallengePage(safePage)
    // Chromium under test opens every popup, so the page sees what a blocking browser returns.
    await safePage.addInitScript(() => Object.assign(window, { open: () => null }))

    await removeSafe(safePage)
    await safePage.getByTestId('step-up-verify-button').click()
    await expect(stepUpDialog(safePage)).toContainText('Your browser blocked the verification window')

    const challenge = safePage.waitForRequest(AUTHORIZE_PATTERN)
    await safePage.getByRole('button', { name: /Verify in this tab instead/ }).click()
    const authorize = new URL((await challenge).url())

    await expect(safePage.getByRole('heading', { name: 'Provider challenge' })).toBeVisible()
    expect(authorize.searchParams.get('elevate')).toBe('true')
    expect(authorize.searchParams.get('redirect_url')).toMatch(
      new RegExp(`/spaces/safe-accounts\\?spaceId=${SPACE_ID}$`),
    )
    expect(removals()).toBe(1)
  })
})
