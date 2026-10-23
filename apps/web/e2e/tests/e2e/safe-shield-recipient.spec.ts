import { Wallet } from 'ethers'
import type { Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SafeShieldPage } from '../../src/pages/safe-shield.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { seedExecutedTransfer, seedSafe, type SeededSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const AMOUNT = '0.001'
// The descriptions of CGW's recipient interaction check (recipient-analysis.constants.ts)
const NEW_RECIPIENT = 'You are interacting with this address for the first time.'
const RECURRING_RECIPIENT_TWICE = 'You have interacted with this address 2 times.'

/** Open the Safe in its Business Workspace, where the recipient check is open, and review a transfer */
async function reviewTransfer(
  page: Page,
  { safe, workspaceId, recipient }: { safe: SeededSafe; workspaceId: string; recipient: string },
): Promise<SafeShieldPage> {
  const sendTokens = new SendTokensPage(page)
  await new HomePage(page).goto(safe.prefixedAddress, workspaceId)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
  const safeShield = new SafeShieldPage(page)
  await safeShield.expandRecipientCard()
  return safeShield
}

test.describe('Safe Shield recipient check', { tag: '@e2e' }, () => {
  test('should report a new recipient when the Safe has never sent to the address', async ({ safePage, journey }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const safeShield = await reviewTransfer(safePage, { safe, workspaceId, recipient })

    await expect(safeShield.recipientFinding(NEW_RECIPIENT)).toBeVisible()
  })

  test('should count the earlier transfers when the Safe has sent to the address before', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    await seedExecutedTransfer(safe, { recipient, amount: AMOUNT })
    await seedExecutedTransfer(safe, { recipient, amount: AMOUNT })
    await expect
      .poll(async () => (await safeApiClient.getRecipientAnalysis(safe.address, recipient)).RECIPIENT_INTERACTION)
      .toEqual([expect.objectContaining({ type: 'RECURRING_RECIPIENT', description: RECURRING_RECIPIENT_TWICE })])
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const safeShield = await reviewTransfer(safePage, { safe, workspaceId, recipient })

    await expect(safeShield.recipientFinding(RECURRING_RECIPIENT_TWICE)).toBeVisible()
    await expect(safeShield.recipientFinding(NEW_RECIPIENT)).toHaveCount(0)
  })
})
