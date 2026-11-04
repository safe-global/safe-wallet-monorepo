/**
 * Transaction history smoke test — critical path, runs every PR.
 *
 * Read-only: the history of a static Safe loads from the real backend. The row content is covered by
 * `ExpandableTransactionItem.fixtures.test.tsx` with recorded data.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { TxHistoryPage } from '../../src/pages/tx-history.page'

test.describe('Transaction history', { tag: '@smoke' }, () => {
  test('should load the history rows of a Safe', async ({ safePage, safes }) => {
    const history = new TxHistoryPage(safePage)

    await history.goto(safes.SEP_HISTORY_SAFE)

    await expect(history.transactionsWithStatus('Success').first()).toBeVisible()
  })
})
