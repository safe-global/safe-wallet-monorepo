/**
 * Live step-up — a Sign-In-with-Ethereum admin runs every gated action and is never asked for a second factor
 * (C3, C5, C7, C8, C9, C10, C11, C15 of the Oct 1 QA run). Uses its own Workspace.
 */
import { Wallet } from 'ethers'
import { test, expect } from '../../src/fixtures/step-up.fixture'
import { recordStepUpTraffic, uniqueLabel } from '../../src/fixtures/step-up'
import { getElevationWindowSeconds } from '../../src/data/step-up-credentials'
import { STEP_UP_SAFES } from '../../src/data/constants'
import { WorkspacePage } from '../../src/pages/workspace.page'

test.describe('Step-up live — wallet sign-in', { tag: '@step-up-live' }, () => {
  test('a wallet admin onboards, manages Safes, contacts, settings and the plan without any challenge', async ({
    walletSession,
    creds,
  }) => {
    test.skip(!creds.adminKey, 'Needs a wallet: set STEP_UP_ADMIN_KEY.')
    const page = await walletSession(creds.adminKey as string)
    const traffic = recordStepUpTraffic(page)
    const ws = new WorkspacePage(page)
    const workspaceName = uniqueLabel('Step-up wallet ws')
    const [address] = STEP_UP_SAFES
    const safeName = uniqueLabel('Wallet Safe')
    const contact = uniqueLabel('Wallet contact')

    // A wallet session carries no second factor; waiting past the window makes a wrongly applied gate show.
    const outsideWindow = () => page.waitForTimeout((getElevationWindowSeconds() + 5) * 1000)
    let spaceId = ''

    await test.step('C10, C11: create a Workspace, claim free access, invite, finish the survey', async () => {
      await ws.createWorkspace(workspaceName)
      await ws.waitForTrialOffer()
      spaceId = new URL(page.url()).searchParams.get('spaceId') ?? ''
      await outsideWindow()
      await ws.claimFreeAccess.click()
      await ws.startStripeTrial(`step-up-wallet+${Date.now()}@example.com`)
      await ws.closeWelcomeModals()
      await ws.skipSelectSafes()
      await ws.inviteInOnboarding(Wallet.createRandom().address)
      await ws.finishSurvey()
      await expect(page).toHaveURL(/\/spaces\?spaceId=/)
    })

    await test.step('C7, C15: add a Safe by address with a name, rename it, remove it', async () => {
      await ws.goto('/spaces/safe-accounts', spaceId)
      await ws.addSafeByAddress(address, safeName)
      await ws.submitAddAccounts()
      await expect(ws.row(safeName)).toBeVisible()
      await ws.renameSafe(new RegExp(address.slice(0, 6), 'i'), `${safeName} renamed`)
      await expect(ws.row(`${safeName} renamed`)).toBeVisible()
      await ws.removeSafe(new RegExp(address.slice(0, 6), 'i'))
      await expect(ws.row(`${safeName} renamed`)).toBeHidden()
    })

    await test.step('C5: add and delete a shared contact', async () => {
      await ws.goto('/spaces/address-book', spaceId)
      await ws.addSharedContact(contact, Wallet.createRandom().address)
      await expect(ws.row(contact)).toBeVisible()
      await ws.deleteContact(contact)
      await expect(ws.row(contact)).toBeHidden()
    })

    await test.step('C3: rename the Workspace', async () => {
      await ws.goto('/spaces/settings/general', spaceId)
      await ws.renameWorkspace(`${workspaceName} renamed`)
      await expect(page.getByTestId('space-name-input')).toHaveValue(`${workspaceName} renamed`)
    })

    await test.step('C8, C9: switch to Starter and back to Business', async () => {
      await ws.goto('/spaces/plans', spaceId)
      await ws.switchToStarter(2)
      await ws.confirmPlanChange()
      await expect(page.getByText("You're on Starter!")).toBeVisible()
      await ws.closeWelcomeModals()
      await page.getByRole('button', { name: 'Upgrade to Business' }).click()
      await ws.confirmPlanChange()
      await expect(page.getByText("You're on Business!")).toBeVisible()
    })

    expect(traffic.elevateRequests).toEqual([])
    expect(traffic.calls.filter((c) => c.status === 403)).toEqual([])
    traffic.stop()
  })
})
