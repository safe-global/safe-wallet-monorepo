import { Wallet } from 'ethers'
import { DRAINER_ADDRESS, SCAN_ERROR_ADDRESS } from '../../environment/infra/mocks/blockaid-addresses'
import { test, expect } from '../../src/fixtures/journey.fixture'
import type { Journey } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SafeShieldPage } from '../../src/pages/safe-shield.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe } from '../../src/seed/safe'
import type { Page } from '@playwright/test'

const AMOUNT = '0.001'

/** Opens the review of an ETH transfer to `recipient` from a new 1/2 Safe, once the gateway has scanned it */
async function reviewTransfer(page: Page, journey: Journey, recipient: string): Promise<SafeShieldPage> {
  const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })
  const sendTokens = new SendTokensPage(page)
  await new HomePage(page).goto(safe.prefixedAddress)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
  const shield = new SafeShieldPage(page)
  await shield.waitForThreatAnalysis()
  return shield
}

// The stack's Blockaid mock (environment/infra/mocks/blockaid-api.ts) decides each verdict from the recipient.
test.describe('Safe Shield threat analysis', { tag: '@e2e' }, () => {
  test('should block Continue until the risk is confirmed when the recipient is a known drainer', async ({
    safePage,
    journey,
  }) => {
    const shield = await reviewTransfer(safePage, journey, DRAINER_ADDRESS)
    const review = new TxReviewPage(safePage)
    await shield.addSafeToAccounts()

    await expect(shield.threatCard).toContainText('Malicious threat detected')
    await expect(shield.status).toHaveText('Risk detected')
    await expect(review.continueButton).toBeDisabled()
    await review.riskConfirmation.click()
    await expect(review.continueButton).toBeEnabled()
  })

  test('should report no threat and ask no confirmation when the recipient is an ordinary address', async ({
    safePage,
    journey,
  }) => {
    const shield = await reviewTransfer(safePage, journey, Wallet.createRandom().address)
    const review = new TxReviewPage(safePage)
    await shield.addSafeToAccounts()

    await expect(shield.threatCard).toContainText('No threat detected')
    await expect(review.riskConfirmation).toBeHidden()
    await expect(review.continueButton).toBeEnabled()
  })

  test('should report a failed threat analysis when the scan fails', async ({ safePage, journey }) => {
    const shield = await reviewTransfer(safePage, journey, SCAN_ERROR_ADDRESS)

    await expect(shield.threatCard).toContainText('Threat analysis failed')
  })
})
