/**
 * A Trezor owner signs and executes Safe transactions on the device.
 *
 * Runs only on the isolated stack, where Trezor Connect's popup reaches an emulated Trezor Safe 5 through Trezor
 * Bridge instead of a USB device, and the test presses the device buttons through the emulator's debug interface. The
 * scenario gives the Trezor two Safes, each with one queued transfer.
 */
import type { Page, TestInfo } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { addSafeToAccounts } from '../../src/fixtures/seed-added-safes'
import { TREZOR_LABEL, TrezorEmulator, type TrezorScreen } from '../../src/api/trezor-emulator'
import { safeAddress } from '../../src/data/constants'
import { TrezorConnectPopup } from '../../src/pages/trezor-connect-popup.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { trezorOwner } from '../../environment/scenarios/trezor.mjs'

// One emulated device serves the whole spec.
test.describe.configure({ mode: 'serial' })

/** The address on the review screen titled `title`, which the device splits into groups. */
function shownAddress(review: TrezorScreen[], title: string): string | undefined {
  return review
    .find((screen) => screen.title.includes(title))
    ?.body.replace(/\s/g, '')
    .toLowerCase()
}

/** What the device showed, one screen per line, in the test report. */
async function attachReview(testInfo: TestInfo, name: string, review: TrezorScreen[]): Promise<void> {
  const body = review.map((screen) => `${screen.title.replace(/\n/g, ' / ')}: ${screen.body}`).join('\n')
  await testInfo.attach(name, { body, contentType: 'text/plain' })
}

/** Runs `action`, which makes the wallet call the device, and answers Trezor Connect's popup that it opens. */
async function answerPopupOf(page: Page, action: () => Promise<void>): Promise<void> {
  const popup = page.waitForEvent('popup')
  await action()
  await new TrezorConnectPopup(await popup, TREZOR_LABEL).answer()
}

test.describe('Trezor signing', { tag: '@e2e' }, () => {
  let device: TrezorEmulator

  test.beforeAll(() => {
    device = new TrezorEmulator()
  })

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return
    await testInfo.attach('trezor-screen', { body: await device.screenshot(), contentType: 'image/png' })
  })

  test('should add the Trezor signature when the owner signs a queued transaction on the device', async ({
    safePage,
    walletPage,
    safes,
  }, testInfo) => {
    const queue = new TxQueuePage(safePage)
    const transactionReview = new TxReviewPage(safePage)
    await addSafeToAccounts(safePage, safes.trezorSign)
    await queue.goto(safes.trezorSign)
    await expect(queue.transactionWithNonce(0)).toContainText('1/3')
    await walletPage.connectTrezor(trezorOwner.address, TREZOR_LABEL)

    await queue.confirm(0)
    await answerPopupOf(safePage, () => transactionReview.sign())
    const review = await device.approve()
    await attachReview(testInfo, 'trezor-review-sign', review)

    expect(shownAddress(review, 'Signing address')).toBe(trezorOwner.address.toLowerCase())
    expect(shownAddress(review, 'EIP712Domain')).toContain(safeAddress(safes.trezorSign).toLowerCase())
    await expect(queue.transactionWithNonce(0)).toContainText('2/3')
  })

  test('should execute a signed transaction when the owner approves it on the device', async ({
    safePage,
    walletPage,
    safes,
  }, testInfo) => {
    const queue = new TxQueuePage(safePage)
    const transactionReview = new TxReviewPage(safePage)
    await addSafeToAccounts(safePage, safes.trezorExecute)
    await queue.goto(safes.trezorExecute)
    await walletPage.connectTrezor(trezorOwner.address, TREZOR_LABEL)

    await queue.execute(0)
    await answerPopupOf(safePage, () => transactionReview.continueAndExecute())
    const review = await device.approve()
    await attachReview(testInfo, 'trezor-review-execute', review)

    expect(shownAddress(review, 'Contract address')).toBe(safeAddress(safes.trezorExecute).toLowerCase())
    await expect(transactionReview.status).toHaveText('Transaction was successful')
  })
})
