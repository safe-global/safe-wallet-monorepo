/**
 * Dashboard smoke tests — critical path, runs every PR.
 *
 * These are read-only tests: they verify the dashboard loads correctly
 * for a known static Safe on Sepolia staging. No mutations, no wallet.
 */
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { test, expect } from '../../src/fixtures/test.fixture'
import { HomePage } from '../../src/pages/home.page'
import { nonceOf } from '../../src/api/transaction-items'
import { safeAddress } from '../../src/data/constants'

/** Rows the widget has room for — mirrors MAX_TXS in src/components/dashboard/PendingTxs/PendingTxsList.tsx */
const WIDGET_ROWS = 4

/** The newest proposal of each nonce, in queue order — the widget sorts each conflict group by timestamp too. */
function latestProposalPerNonce(queue: Transaction[]): Transaction[] {
  const latest = new Map<number | undefined, Transaction>()
  for (const transaction of queue) {
    const nonce = nonceOf(transaction)
    const current = latest.get(nonce)
    if (!current || transaction.timestamp > current.timestamp) latest.set(nonce, transaction)
  }
  return [...latest.values()]
}

function confirmationsLabel(transaction: Transaction): string {
  const info = transaction.executionInfo
  if (info?.type !== 'MULTISIG') throw new Error(`${transaction.id} is not a multisig transaction`)
  return `${info.confirmationsSubmitted}/${info.confirmationsRequired}`
}

test.describe('Dashboard', { tag: '@smoke' }, () => {
  let homePage: HomePage

  test.beforeEach(async ({ safePage, safes }) => {
    homePage = new HomePage(safePage)
    await homePage.goto(safes.SEP_STATIC_SAFE_1)
  })

  test('should load the dashboard and show Safe header info', async () => {
    await homePage.waitForDashboardLoaded()
    await expect(homePage.safeHeaderInfo).toBeVisible()
  })

  test('should show the total balance with Send disabled and Receive enabled when no wallet is connected', async () => {
    await expect(homePage.overviewWidget.getByText('Total balance')).toBeVisible()
    await expect(homePage.overviewSendBtn).toBeDisabled()
    await expect(homePage.overviewReceiveBtn).toBeEnabled()
  })

  test('should display the sidebar navigation', async () => {
    await expect(homePage.sidebar).toBeVisible()
  })

  test('should show connect wallet button when no wallet is connected', async () => {
    await expect(homePage.connectWalletBtn).toBeVisible()
  })
})

test.describe('Dashboard pending transactions', { tag: '@smoke' }, () => {
  test('should show only the newest of conflicting proposals for each queued nonce, with its confirmations', async ({
    safePage,
    safeApiClient,
    safes,
  }) => {
    const queue = await safeApiClient.getQueued(safeAddress(safes.SEP_QUEUE_SAFE))
    const expected = latestProposalPerNonce(queue).slice(0, WIDGET_ROWS)
    const shownNonces = new Set(expected.map(nonceOf))
    const olderProposals = queue.filter(
      (transaction) => shownNonces.has(nonceOf(transaction)) && !expected.includes(transaction),
    )
    // Precondition: a nonce that the widget shows has conflicting proposals, so the widget must leave the older out.
    expect(
      olderProposals.length,
      `${safes.SEP_QUEUE_SAFE} has no conflicting proposals among the nonces the widget shows`,
    ).toBeGreaterThan(0)

    const home = new HomePage(safePage)
    await home.goto(safes.SEP_QUEUE_SAFE)

    await expect(home.pendingTxRows).toHaveCount(expected.length)
    for (const [index, transaction] of expected.entries()) {
      const row = home.pendingTxRows.nth(index)
      await expect(row).toHaveAttribute('href', new RegExp(`[?&]id=${transaction.id}(&|$)`))
      await expect(row).toContainText(confirmationsLabel(transaction))
    }
  })
})
