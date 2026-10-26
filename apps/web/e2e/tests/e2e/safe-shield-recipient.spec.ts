import { Wallet } from 'ethers'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { transactionsIn } from '../../src/api/transaction-items'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SafeShieldPage } from '../../src/pages/safe-shield.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { seedExecutedTransfer, seedSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const AMOUNT = '0.001'
// The descriptions of CGW's recipient interaction check (recipient-analysis.constants.ts)
const NEW_RECIPIENT = 'You are interacting with this address for the first time.'
const RECURRING_RECIPIENT_TWICE = 'You have interacted with this address 2 times.'

function transfersTo(history: TransactionItemPage, recipient: string): number {
  return transactionsIn(history).filter(
    ({ txInfo }) => txInfo.type === 'Transfer' && txInfo.recipient.value === recipient,
  ).length
}

test.describe('Safe Shield recipient check', { tag: '@e2e' }, () => {
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
      .poll(async () => transfersTo(await safeApiClient.getTransactionHistory(safe.address), recipient))
      .toBe(2)
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const sendTokens = new SendTokensPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress, workspaceId)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    const safeShield = new SafeShieldPage(safePage)
    await safeShield.expandRecipientCard()

    await expect(safeShield.recipientFinding(RECURRING_RECIPIENT_TWICE)).toBeVisible()
    await expect(safeShield.recipientFinding(NEW_RECIPIENT)).toHaveCount(0)
  })
})
