/**
 * Regression — step-up (2FA) for sensitive Workspace actions, end to end against a real CGW and Auth0.
 *
 * `step-up-auth.spec.ts` covers the client round-trip with mocked responses. This file drives the real thing:
 * the CGW `ElevationGuard`, the Auth0 OTP challenge and the replay of the interrupted request, for an
 * email/Google session (gated) and a Sign-In-with-Ethereum session (never gated).
 *
 * Needs `E2E_STEP_UP_CREDENTIALS` (see src/data/step-up-credentials.ts) and the target web build pointing at a
 * CGW with `FF_MFA_STEP_UP` on. Each group skips when its identity is missing. Tests wait out the real
 * elevation window (60 s on dev/staging), so they are slow by design and run serially.
 *
 * Run: PLAYWRIGHT_BASE_URL=https://safe-wallet-web.dev.5afe.dev yarn workspace @safe-global/web pw:test step-up-live
 * Tag: @regression — on demand, not part of the PR smoke run.
 */
import { Wallet } from 'ethers'
import type { Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { getElevationWindowSeconds, getStepUpCredentials } from '../../src/data/step-up-credentials'
import { Auth0ChallengePage } from '../../src/pages/auth0-challenge.page'
import { WalletPage } from '../../src/pages/wallet.page'
import { seedConnectedWallet } from '../../src/fixtures/seed-wallet'
import { recordStepUpTraffic, uniqueLabel, waitForWindowToLapse } from '../../src/fixtures/step-up'

const credentials = getStepUpCredentials()

function required<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`E2E_STEP_UP_CREDENTIALS.${name} is not set`)
  return value
}
const STEP_UP_TEST_TIMEOUT = 4 * 60_000

const ADDRESS_BOOK = /\/v1\/spaces\/[^/]+\/address-book$/
const ADDRESS_BOOK_ENTRY = /\/v1\/spaces\/[^/]+\/address-book\/0x[0-9a-fA-F]{40}$/
const SPACE = /\/v1\/spaces\/[^/]+$/
const INVITE = /\/v1\/spaces\/[^/]+\/members\/invite$/
const MEMBER = /\/v1\/spaces\/[^/]+\/members\/\d+$/

const addressBookUrl = (spaceId: string) => `/spaces/address-book?spaceId=${spaceId}`

async function addSharedContact(page: Page, name: string, address: string): Promise<void> {
  await page.getByRole('button', { name: 'Add shared contact' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Name').fill(name)
  await dialog.getByLabel('Address or ENS').fill(address)
  await dialog.getByRole('button', { name: 'Add contact' }).click()
}

async function deleteSharedContact(page: Page, name: string): Promise<void> {
  await page
    .getByRole('row', { name: new RegExp(name) })
    .getByRole('button', { name: 'Delete entry' })
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
}

test.describe('Step-up on a live CGW — email/Google session', { tag: '@regression' }, () => {
  test.skip(!credentials.oidc, 'E2E_STEP_UP_CREDENTIALS.oidc is not set')
  test.describe.configure({ mode: 'serial' })
  test.use({ storageState: credentials.oidc?.storageState })
  test.setTimeout(STEP_UP_TEST_TIMEOUT)

  const oidc = () => required(credentials.oidc, 'oidc')

  test('asks for a fresh code, then saves the contact, and deletes it without asking again inside the window', async ({
    safePage,
  }) => {
    const challenge = new Auth0ChallengePage(safePage)
    const name = uniqueLabel('Step-up contact')
    const address = Wallet.createRandom().address

    await safePage.goto(addressBookUrl(oidc().spaceId))
    await waitForWindowToLapse(safePage)
    const traffic = recordStepUpTraffic(safePage)

    await addSharedContact(safePage, name, address)
    await challenge.completeWithAuthenticator(oidc().totpSecret)

    await expect(safePage).toHaveURL(new RegExp(`/spaces/address-book\\?spaceId=${oidc().spaceId}`))
    await expect(safePage.getByRole('row', { name: new RegExp(name) })).toBeVisible()
    expect(traffic.callsTo('PUT', ADDRESS_BOOK).map((c) => c.status)).toEqual([403, 200])
    expect(traffic.elevateRequests).toHaveLength(1)

    await deleteSharedContact(safePage, name)

    await expect(safePage.getByRole('row', { name: new RegExp(name) })).toBeHidden()
    expect(traffic.callsTo('DELETE', ADDRESS_BOOK_ENTRY).map((c) => c.status)).toEqual([200])
    expect(traffic.elevateRequests).toHaveLength(1)
    traffic.stop()
  })

  test('renames the Workspace after a fresh code and renames it back inside the window', async ({ safePage }) => {
    const challenge = new Auth0ChallengePage(safePage)
    const nameInput = safePage.getByTestId('space-name-input')

    await safePage.goto(`/spaces/settings/general?spaceId=${oidc().spaceId}`)
    const originalName = await nameInput.inputValue()
    const temporaryName = uniqueLabel('Step-up rename')
    await waitForWindowToLapse(safePage)
    const traffic = recordStepUpTraffic(safePage)

    await nameInput.fill(temporaryName)
    await safePage.getByTestId('space-save-button').click()
    await challenge.completeWithAuthenticator(oidc().totpSecret)
    await expect(nameInput).toHaveValue(temporaryName)

    await nameInput.fill(originalName)
    await safePage.getByTestId('space-save-button').click()
    await expect(nameInput).toHaveValue(originalName)

    expect(traffic.callsTo('PATCH', SPACE).map((c) => c.status)).toEqual([403, 200, 200])
    expect(traffic.elevateRequests).toHaveLength(1)
    traffic.stop()
  })

  test('invites a member after a fresh code and removes the invitation inside the window', async ({ safePage }) => {
    const challenge = new Auth0ChallengePage(safePage)
    const name = uniqueLabel('Step-up invitee')

    await safePage.goto(`/spaces/members?spaceId=${oidc().spaceId}`)
    await waitForWindowToLapse(safePage)
    const traffic = recordStepUpTraffic(safePage)

    await safePage.getByRole('button', { name: 'Add member' }).click()
    const dialog = safePage.getByRole('dialog')
    await dialog.getByLabel('Name').fill(name)
    await dialog.getByLabel('Address, email or ENS').fill(Wallet.createRandom().address)
    await dialog.getByRole('button', { name: 'Add member' }).click()
    await challenge.completeWithAuthenticator(oidc().totpSecret)

    await safePage.getByTestId('pending-members-tab').click()
    const invitation = safePage.getByRole('row', { name: new RegExp(name) })
    await expect(invitation).toBeVisible()

    await invitation.getByRole('button', { name: 'Remove invitation' }).click()
    await safePage.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
    await expect(invitation).toBeHidden()

    expect(traffic.callsTo('POST', INVITE).map((c) => c.status)).toEqual([403, 201])
    expect(traffic.callsTo('DELETE', MEMBER).map((c) => c.status)).toEqual([200])
    expect(traffic.elevateRequests).toHaveLength(1)
    traffic.stop()
  })

  test('rejects a code that is not current and accepts the right one', async ({ safePage }) => {
    const challenge = new Auth0ChallengePage(safePage)
    const name = uniqueLabel('Wrong code contact')

    await safePage.goto(addressBookUrl(oidc().spaceId))
    await waitForWindowToLapse(safePage)

    await addSharedContact(safePage, name, Wallet.createRandom().address)
    await challenge.waitForChallenge()
    await challenge.submitCode('000000')
    await expect(challenge.invalidCodeError).toBeVisible()

    await challenge.completeWithAuthenticator(oidc().totpSecret)
    await expect(safePage.getByRole('row', { name: new RegExp(name) })).toBeVisible()

    await deleteSharedContact(safePage, name)
    await expect(safePage.getByRole('row', { name: new RegExp(name) })).toBeHidden()
  })

  test('saves nothing when the user leaves the challenge with Back', async ({ safePage }) => {
    const challenge = new Auth0ChallengePage(safePage)
    const name = uniqueLabel('Abandoned contact')

    await safePage.goto(addressBookUrl(oidc().spaceId))
    await waitForWindowToLapse(safePage)
    const traffic = recordStepUpTraffic(safePage)

    await addSharedContact(safePage, name, Wallet.createRandom().address)
    await challenge.waitForChallenge()
    await safePage.goBack()
    await safePage.goBack()

    await expect(safePage).toHaveURL(/\/spaces\/address-book/)
    await expect(safePage.getByRole('button', { name: 'Add shared contact' })).toBeVisible()
    await expect(safePage.getByRole('row', { name: new RegExp(name) })).toBeHidden()
    expect(traffic.callsTo('PUT', ADDRESS_BOOK).every((c) => c.status === 403)).toBe(true)
    traffic.stop()
  })

  // Known gaps from the Oct 1 QA run on dev. Turn into real tests once the fixes land.
  test.fixme('keeps the names entered when adding Safes across a step-up (#8884)', async () => {})
  test.fixme(
    'moves on from onboarding "Invite your team" after a step-up instead of reopening the step',
    async () => {},
  )
})

test.describe('Step-up on a live CGW — Sign-In-with-Ethereum session', { tag: '@regression' }, () => {
  test.skip(!credentials.siwe, 'E2E_STEP_UP_CREDENTIALS.siwe is not set')
  test.setTimeout(STEP_UP_TEST_TIMEOUT)

  const siwe = () => required(credentials.siwe, 'siwe')

  test('never asks for a second factor, even after the window', async ({ safePage }) => {
    await seedConnectedWallet(safePage, siwe().privateKey)
    const wallet = new WalletPage(safePage)
    const name = uniqueLabel('SIWE contact')

    await safePage.goto('/welcome/spaces')
    await wallet.accountCenter.waitFor({ state: 'visible' })
    if (await wallet.siweContinueBtn.isVisible()) await wallet.signInWithEthereum()
    await safePage.goto(addressBookUrl(siwe().spaceId))
    // A wallet session carries no second factor; wait past the window anyway so a wrongly applied gate would show.
    await safePage.waitForTimeout((getElevationWindowSeconds() + 5) * 1000)
    const traffic = recordStepUpTraffic(safePage)

    await addSharedContact(safePage, name, Wallet.createRandom().address)
    await expect(safePage.getByRole('row', { name: new RegExp(name) })).toBeVisible()
    await deleteSharedContact(safePage, name)
    await expect(safePage.getByRole('row', { name: new RegExp(name) })).toBeHidden()

    expect(traffic.elevateRequests).toEqual([])
    expect(traffic.callsTo('PUT', ADDRESS_BOOK).map((c) => c.status)).toEqual([200])
    traffic.stop()
  })
})
