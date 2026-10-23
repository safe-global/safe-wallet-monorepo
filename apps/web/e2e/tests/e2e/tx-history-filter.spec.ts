import { Wallet } from 'ethers'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { TxHistoryPage } from '../../src/pages/tx-history.page'
import { seedExecutedTransfer, seedSafe } from '../../src/seed/safe'

test.describe('Filter the transaction history', { tag: '@e2e' }, () => {
  test('should list only the executed transfer when an owner filters the history by outgoing transactions', async ({
    safePage,
    journey,
  }) => {
    // seedSafe funds the Safe with 1 ETH, its incoming transfer
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    await seedExecutedTransfer(safe, { recipient: Wallet.createRandom().address, amount: '0.001' })

    const history = new TxHistoryPage(safePage)
    await history.goto(safe.prefixedAddress)
    await expect(history.transactionsLabelled('Sent')).toHaveCount(1)
    await expect(history.transactionsLabelled('Received')).toHaveCount(1)

    // Incoming is the form's default type, so Outgoing proves that the choice reaches the request
    await history.filterByType('Outgoing')

    await expect(safePage).toHaveURL(/type=Outgoing/)
    await expect(history.transactions).toHaveCount(1)
    await expect(history.transactionsLabelled('Sent')).toHaveCount(1)
  })
})
