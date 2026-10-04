/**
 * Live step-up — onboarding of a new Workspace by the email user (A2, A3, A4, A12, A13 of the Oct 1 QA run).
 * Creates the Workspace every later spec in this run works in.
 */
import { Wallet } from 'ethers'
import { test, expect } from '../../src/fixtures/step-up.fixture'
import { uniqueLabel, writeRunState } from '../../src/fixtures/step-up'
import { WorkspacePage } from '../../src/pages/workspace.page'

const CHECKOUT_URL = /\/v1\/billing\/spaces\/[^/]+\/payment-links\/[^/]+\/checkout-url$/
const INVITE = /\/v1\/spaces\/[^/]+\/members\/invite$/

test.describe('Step-up live — onboarding', { tag: '@step-up-live' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('claiming free access asks for a fresh code, comes back to checkout, and starts the trial', async ({
    safePage,
    creds,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const name = uniqueLabel('Step-up QA')

    await ws.createWorkspace(name)
    await ws.waitForTrialOffer()
    expect(traffic.callsTo('POST', /\/v1\/spaces$/).map((c) => c.status)).toEqual([201])
    const spaceId = new URL(safePage.url()).searchParams.get('spaceId')
    expect(spaceId).toBeTruthy()
    writeRunState({ spaceId: spaceId as string, spaceName: name })

    await test.step('A12: Claim free access after the window → step-up → Stripe checkout', async () => {
      await lapse()
      await ws.claimFreeAccess.click()
      await stepUp()
      await safePage.waitForURL(/checkout\.stripe\.com/)
      expect(traffic.callsTo('GET', CHECKOUT_URL).map((c) => c.status)).toEqual([403, 200])
    })

    await test.step('A13: Back from Stripe returns to the trial offer', async () => {
      await ws.leaveStripeCheckout()
      await expect(safePage).toHaveURL(/\/welcome\/select-safes/)
      await expect(ws.claimFreeAccess).toBeVisible()
    })

    await test.step('A3: claim again inside the window → straight to Stripe → trial starts', async () => {
      await ws.claimFreeAccess.click()
      await ws.startStripeTrial(creds.email)
      await expect(safePage).toHaveURL(/\/welcome\/select-safes\?.*spaceId=/)
      await ws.closeWelcomeModals()
      expect(traffic.elevateRequests).toHaveLength(1)
    })
  })

  test('inviting in onboarding asks for a fresh code and moves on to the survey (A4)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)

    await ws.goto('/welcome/select-safes', workspace.spaceId)
    await ws.closeWelcomeModals()
    await ws.skipSelectSafes()
    await expect(safePage).toHaveURL(/\/welcome\/invite-members/)

    await lapse()
    await ws.inviteInOnboarding(Wallet.createRandom().address)
    await stepUp()

    await expect(safePage).toHaveURL(/\/welcome\/survey/)
    expect(traffic.callsTo('POST', INVITE).map((c) => c.status)).toEqual([403, 201])

    await ws.finishSurvey()
    await expect(safePage).toHaveURL(new RegExp(`/spaces\\?spaceId=${workspace.spaceId}`))
  })
})
