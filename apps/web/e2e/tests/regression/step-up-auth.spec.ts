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
import { toast } from '../../src/fixtures/step-up'
import { LS_NAMESPACE } from '../../src/data/constants'

/**
 * When a sensitive action needs a fresh second factor, the user is sent to Auth0,
 * and the state of the action they were trying to perform has to be preserved
 * until they come back. That state is kept in sessionStorage. There are many ways
 * for it to become corrupted during this interaction, so this file tests the
 * unhappy paths.
 */

const SIGNER = '0x1234567890123456789012345678901234567890'
const CHAIN_ID = '1'
const SPACE_ID = '00000000-0000-0000-0000-0000000000bb'
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const SAFE_ACCOUNTS_URL = `/spaces/safe-accounts?spaceId=${SPACE_ID}`
const STEP_UP_KEY = 'oidc_step_up'
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

async function gateSafeRemoval(page: Page): Promise<void> {
  await page.route(SPACE_SAFES_PATTERN, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    return route.fulfill(ELEVATION_REQUIRED_RESPONSE)
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

async function openRemoveDialog(page: Page): Promise<void> {
  await page.goto(SAFE_ACCOUNTS_URL)
  await page.getByRole('button', { name: 'Safe Account actions' }).first().click()
  await page.getByRole('menuitem', { name: 'Remove from Workspace' }).click()
}

const readStepUpRecord = (page: Page) => page.evaluate((key) => window.sessionStorage.getItem(key), STEP_UP_KEY)

test.describe('Step-up auth round-trip', { tag: '@regression' }, () => {
  test.beforeEach(async ({ safePage }) => {
    await seedWorkspaceSession(safePage)
    await gateSafeRemoval(safePage)
    await stubProviderChallengePage(safePage)
  })

  test('that it replays an abandoned challenge once, silently, without starting a new one', async ({ safePage }) => {
    await openRemoveDialog(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()
    await expect(safePage.getByRole('heading', { name: 'Provider challenge' })).toBeVisible()

    await safePage.goto(SAFE_ACCOUNTS_URL)

    await expect.poll(() => readStepUpRecord(safePage)).toBeNull()
    await expect(toast(safePage, 'Verification was not completed')).toBeHidden()
    await expect(safePage.getByText(ELEVATION_REQUIRED_ERROR)).toBeHidden()
  })

  test('that it reports an error when the replayed action fails', async ({ safePage }) => {
    await stubCompletedChallenge(safePage)

    let removalCalls = 0
    await safePage.route(SPACE_SAFES_PATTERN, async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback()

      removalCalls += 1
      return removalCalls === 1
        ? route.fulfill(ELEVATION_REQUIRED_RESPONSE)
        : route.fulfill({ status: 500, json: { message: 'Internal error', statusCode: 500 } })
    })

    await openRemoveDialog(safePage)
    await safePage.getByRole('button', { name: 'Remove' }).click()

    await expect(toast(safePage, 'Internal error')).toBeVisible()
    await expect.poll(() => readStepUpRecord(safePage)).toBeNull()
  })
})
