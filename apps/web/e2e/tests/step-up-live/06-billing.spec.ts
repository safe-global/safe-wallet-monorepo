/**
 * Live step-up — plans and billing of the run's Workspace (A15, A16, A17, A28, A42, P04, P08 of the QA runs).
 * The locked-Workspace state is simulated in this browser only, by marking the subscription canceled in the response;
 * every write goes to the real CGW and Stripe sandbox.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/step-up.fixture'
import { uniqueLabel } from '../../src/fixtures/step-up'
import { CGW_BASE_URL, STEP_UP_SAFES } from '../../src/data/constants'
import { WorkspacePage } from '../../src/pages/workspace.page'

const SUBSCRIPTION = /\/v1\/billing\/spaces\/[^/]+\/subscriptions\/[^/]+$/
const CHECKOUT_URL = /\/v1\/billing\/spaces\/[^/]+\/payment-links\/[^/]+\/checkout-url$/
const SESSION_URL = /\/v1\/billing\/spaces\/[^/]+\/session-url$/
const SAFES = /\/v1\/spaces\/[^/]+\/safes$/
const PLANS = '/spaces/plans'

async function spaceSafeCount(page: Page, spaceId: string): Promise<number> {
  const response = await page.context().request.get(`${CGW_BASE_URL}/v1/spaces/${spaceId}/safes`)
  const { safes } = (await response.json()) as { safes: Record<string, string[]> }
  return Object.values(safes).flat().length
}

async function simulateLockedWorkspace(page: Page, spaceId: string): Promise<void> {
  await page.route(new RegExp(`/v1/billing/spaces/${spaceId}/subscriptions(\\?|$)`), async (route) => {
    const response = await route.fetch()
    const subscriptions = (await response.json()) as Array<Record<string, unknown>>
    const canceled = subscriptions.map((s) => ({
      ...s,
      status: 'canceled',
      cancelledAt: Math.floor(Date.now() / 1000),
    }))
    await route.fulfill({ response, json: canceled })
  })
}

/** Adds the suite's Safes the Workspace doesn't hold yet, so a downgrade to Starter (2 Safes) has to trim. */
async function fillWorkspace(ws: WorkspacePage, page: Page, spaceId: string, stepUp: () => Promise<void>) {
  await ws.goto('/spaces/safe-accounts', spaceId)
  for (const address of STEP_UP_SAFES) {
    if ((await spaceSafeCount(page, spaceId)) >= 3) return
    if (await ws.row(new RegExp(address.slice(0, 6), 'i')).isVisible()) continue
    await ws.addSafeByAddress(address, uniqueLabel('Billing Safe'))
    await ws.submitAddAccounts()
    if (
      await page.waitForURL(/auth0\.com/, { timeout: 10_000 }).then(
        () => true,
        () => false,
      )
    )
      await stepUp()
    await expect(ws.dialog).toBeHidden()
  }
}

test.describe('Step-up live — plans and billing', { tag: '@step-up-live' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('switches to Starter with a seat trim after a fresh code (A15, A28)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    await fillWorkspace(ws, safePage, workspace.spaceId, stepUp)
    expect(await spaceSafeCount(safePage, workspace.spaceId)).toBeGreaterThan(2)

    await ws.goto(PLANS, workspace.spaceId)
    await ws.switchToStarter(2)
    await lapse()
    await ws.confirmPlanChange()
    await stepUp()

    await expect(safePage.getByText("You're on Starter!")).toBeVisible()
    expect(traffic.callsTo('PATCH', SUBSCRIPTION).map((c) => c.status)).toEqual([403, 200])
    expect(await spaceSafeCount(safePage, workspace.spaceId)).toBe(2)
  })

  test('upgrades to Business after a fresh code, then switches and upgrades again inside the window (A16, P08)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    await ws.goto(PLANS, workspace.spaceId)

    await lapse()
    await safePage.getByRole('button', { name: 'Upgrade to Business' }).click()
    await ws.confirmPlanChange()
    await stepUp()
    await expect(safePage.getByText("You're on Business!")).toBeVisible()
    await ws.closeWelcomeModals()

    await ws.switchToStarter(2)
    await ws.confirmPlanChange()
    await expect(safePage.getByText("You're on Starter!")).toBeVisible()
    await ws.closeWelcomeModals()
    await safePage.getByRole('button', { name: 'Upgrade to Business' }).click()
    await ws.confirmPlanChange()
    await expect(safePage.getByText("You're on Business!")).toBeVisible()

    expect(traffic.callsTo('PATCH', SUBSCRIPTION).map((c) => c.status)).toEqual([403, 200, 200, 200])
    expect(traffic.elevateRequests).toHaveLength(1)
  })

  test('opens the Stripe portal without a code (A17, known gap: the portal can cancel the subscription)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
  }) => {
    test.info().annotations.push({ type: 'known gap', description: 'session-url is not gated by CGW yet' })
    const ws = new WorkspacePage(safePage)
    await ws.goto(PLANS, workspace.spaceId)

    await lapse()
    await safePage
      .getByRole('button', { name: /Add payment method|Manage plan/ })
      .first()
      .click()

    await safePage.waitForURL(/billing\.stripe\.com/)
    expect(traffic.callsTo('GET', SESSION_URL).map((c) => c.status)).toEqual([200])
    expect(traffic.elevateRequests).toHaveLength(0)
  })

  test('locked Workspace: Continue with Business after the window asks for a code and opens checkout (P04)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    await simulateLockedWorkspace(safePage, workspace.spaceId)
    const ws = new WorkspacePage(safePage)
    await ws.goto('/spaces', workspace.spaceId)

    await lapse()
    await ws.dialog.getByRole('button', { name: /Continue with Business/ }).click()
    await stepUp()

    await safePage.waitForURL(/checkout\.stripe\.com/)
    expect(traffic.callsTo('GET', CHECKOUT_URL).map((c) => c.status)).toEqual([403, 200])
  })

  test('locked Workspace: Starter with a seat trim after the window removes the Safe and opens checkout (A42, WA-3706)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    test.fail(true, 'WA-3706: after the step-up only the removal is replayed and checkout never opens (fix: #8908)')
    const ws = new WorkspacePage(safePage)
    await fillWorkspace(ws, safePage, workspace.spaceId, stepUp)
    await simulateLockedWorkspace(safePage, workspace.spaceId)
    await ws.goto('/spaces', workspace.spaceId)

    await ws.dialog.getByRole('button', { name: /Switch to Starter|Continue with Starter/ }).click()
    const removable = ws.dialog.locator('[role=checkbox][aria-checked=true]')
    while ((await removable.count()) > 2) await removable.last().click()
    await lapse()
    await ws.dialog.getByRole('button', { name: /Continue to checkout/ }).click()
    await stepUp()

    expect(traffic.callsTo('DELETE', SAFES).map((c) => c.status)).toEqual([403, 204])
    await safePage.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 })
    expect(traffic.callsTo('GET', CHECKOUT_URL).map((c) => c.status)).toEqual([200])
  })
})
