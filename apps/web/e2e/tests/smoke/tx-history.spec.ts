/**
 * Transaction history smoke test — critical path, runs every PR.
 *
 * Read-only: the history of the `basic` Safe, its creation, loads from the local backend. The row content is covered by
 * `ExpandableTransactionItem.fixtures.test.tsx` with recorded data.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { TxHistoryPage } from '../../src/pages/tx-history.page'

test.describe('Transaction history', { tag: '@smoke' }, () => {
  test('should load the history rows of a Safe', async ({ safePage, safes }) => {
    const history = new TxHistoryPage(safePage)

    await history.goto(safes.basic)

    await expect(history.transactionsWithStatus('Success').first()).toBeVisible()
  })
})
