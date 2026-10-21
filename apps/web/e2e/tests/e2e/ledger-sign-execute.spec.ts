/**
 * A Ledger owner signs and executes Safe transactions on the device.
 *
 * Runs only on the isolated stack, where the wallet reaches an emulated Ledger Nano S Plus (Speculos) instead of a
 * USB device, and the test presses the device buttons through the emulator's API. The scenario gives the Ledger two
 * Safes, each with one queued transfer.
 */
import type { TestInfo } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { LedgerEmulator } from '../../src/api/ledger-emulator'
import { TransactionQueuePage } from '../../src/pages/transaction-queue.page'
import { ledgerOwner } from '../../environment/scenarios/ledger.mjs'

// One emulated device serves the whole spec.
test.describe.configure({ mode: 'serial' })

/** The transaction hash the device shows on its "Tx hash (n/m)" screens. */
function deviceTransactionHash(review: string[]): string {
  return review
    .filter((screen) => screen.startsWith('Tx hash'))
    .map((screen) => screen.replace(/^Tx hash \(\d+\/\d+\)/, '').replace(/ /g, ''))
    .join('')
}

/** What the device showed, one screen per line, in the test report. */
async function attachReview(testInfo: TestInfo, name: string, review: string[]): Promise<void> {
  await testInfo.attach(name, { body: review.join('\n'), contentType: 'text/plain' })
}

test.describe('Ledger signing', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Needs the emulated Ledger of the isolated stack')

  let device: LedgerEmulator

  test.beforeAll(async () => {
    device = new LedgerEmulator()
    await device.enableBlindSigning()
  })

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return
    await testInfo.attach('ledger-screen', { body: await device.screenshot(), contentType: 'image/png' })
  })

  test('should add the Ledger signature when the owner signs a queued transaction on the device', async ({
    safePage,
    walletPage,
    safes,
  }, testInfo) => {
    const queue = new TransactionQueuePage(safePage)
    await queue.goto(safes.SEP_LEDGER_SIGN_SAFE)
    await expect(queue.queuedTransaction).toContainText('1/3')
    await walletPage.connectLedger(ledgerOwner.address)

    await queue.startSigning()
    const review = await device.approve('Sign message')
    await attachReview(testInfo, 'ledger-review-sign', review)

    expect(review).toContain('Review typed message')
    await expect(queue.queuedTransaction).toContainText('2/3')
  })

  test('should execute a signed transaction when the owner approves it on the device', async ({
    safePage,
    walletPage,
    safes,
  }, testInfo) => {
    const queue = new TransactionQueuePage(safePage)
    await queue.goto(safes.SEP_LEDGER_EXECUTE_SAFE)
    await walletPage.connectLedger(ledgerOwner.address)

    await queue.startExecution()
    await expect(queue.hashComparisonDialog).toBeVisible()
    // The dialog closes once the device signs, so its hash is read before the approval.
    const appHash = (await queue.hashComparisonDialog.innerText()).toLowerCase()
    const review = await device.approve('Accept risk and sign transaction')
    await attachReview(testInfo, 'ledger-review-execute', review)

    expect(review).toContain('Review transaction')
    const deviceHash = deviceTransactionHash(review).toLowerCase()
    expect(deviceHash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(appHash).toContain(deviceHash)
    await expect(queue.transactionStatus).toHaveText('Transaction was successful', { timeout: 120_000 })
  })
})
