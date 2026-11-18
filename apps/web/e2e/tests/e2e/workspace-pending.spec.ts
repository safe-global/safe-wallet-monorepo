import type { Page } from '@playwright/test'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Wallet, parseEther, parseUnits } from 'ethers'
import { confirmationsOf } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { gatewayRequest, type EmailSession } from '../../src/fixtures/email-session'
import { test, expect, type Journey } from '../../src/fixtures/journey.fixture'
import { ROUTES } from '../../src/data/constants'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { WorkspaceTransactionsPage } from '../../src/pages/workspace-transactions.page'
import { seedProposer } from '../../src/seed/proposers'
import {
  ethTransfer,
  seedQueuedTokenTransfer,
  seedQueuedTransfer,
  seedSafe,
  type SeededSafe,
  type SafeSetup,
} from '../../src/seed/safe'
import { seedSignedTransaction, seedSignedTransfer } from '../../src/seed/signatures'
import {
  ETHEREUM_USDC,
  POLYGON_USDC,
  SEPOLIA_USDC,
  seedTokenBalance,
  waitForNativeBalance,
  type SeedToken,
} from '../../src/seed/tokens'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const ETH = {
  treasury: '0.0011',
  payroll: '0.0012',
  payrollBatchItem: '0.0001',
  payrollLater: '0.0013',
  reserve: '0.0014',
  grants: '0.0015',
  proposed: '0.0016',
}
const USDC = { treasury: '5', reserve: '6', grants: '7' }

type PendingWorkspace = {
  id: string
  session: EmailSession
  recipient: string
  treasury: SeededSafe
  payroll: SeededSafe
  operations: SeededSafe
}

async function seedSafeOn(
  journey: Journey,
  setup: SafeSetup,
  token: SeedToken,
  transfers: { recipient: string; eth: string; usdc: string },
) {
  const safe = await seedSafe(journey, setup)
  await seedTokenBalance(safe, { token, amount: parseUnits(transfers.usdc, token.decimals) })
  await seedQueuedTransfer(safe, { nonce: 0, recipient: transfers.recipient, amount: transfers.eth })
  await seedQueuedTokenTransfer(safe, {
    nonce: 1,
    token: token.address,
    recipient: transfers.recipient,
    amount: parseUnits(transfers.usdc, token.decimals),
  })
  return safe
}

async function seedSepoliaSafes(journey: Journey, recipient: string) {
  const treasury = await seedSafeOn(journey, { owners: ['carol', 'alice', 'bob'], threshold: 3 }, SEPOLIA_USDC, {
    recipient,
    eth: ETH.treasury,
    usdc: USDC.treasury,
  })

  const payroll = await seedSafe(journey, { owners: ['alice', 'bob', 'carol'], threshold: 2 })
  await seedSignedTransfer(journey, payroll, { nonce: 0, recipient, amount: ETH.payroll })
  await seedSignedTransaction(journey, payroll, {
    nonce: 1,
    transactions: [ethTransfer(recipient, ETH.payrollBatchItem), ethTransfer(recipient, ETH.payrollBatchItem)],
  })
  await seedQueuedTransfer(payroll, { nonce: 2, recipient, amount: ETH.payrollLater })

  const operations = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
  await seedProposer(operations, { delegate: journey.owners.dave, delegator: journey.owners.alice })
  await waitForNativeBalance(operations)

  return { treasury, payroll, operations }
}

/** The pre-set-up Workspace of the QA plan: 9 pending transactions on 5 Safes across Sepolia, Ethereum and Polygon */
async function seedPendingWorkspace(journey: Journey, page: Page): Promise<PendingWorkspace> {
  const recipient = Wallet.createRandom().address
  const [sepolia, reserve, grants] = await Promise.all([
    seedSepoliaSafes(journey, recipient),
    seedSafeOn(journey, { owners: ['alice'], threshold: 1, network: 'ethereum' }, ETHEREUM_USDC, {
      recipient,
      eth: ETH.reserve,
      usdc: USDC.reserve,
    }),
    seedSafeOn(journey, { owners: ['alice', 'bob'], threshold: 2, network: 'polygon' }, POLYGON_USDC, {
      recipient,
      eth: ETH.grants,
      usdc: USDC.grants,
    }),
  ])
  const { id, session } = await seedBusinessWorkspace(page, {
    Treasury: sepolia.treasury,
    Payroll: sepolia.payroll,
    Operations: sepolia.operations,
    Reserve: reserve,
    Grants: grants,
  })
  return { id, session, recipient, ...sepolia }
}

const rowsWithout = (rows: string[], text: string): string[] => rows.filter((row) => !row.includes(text)).sort()

/** The IDs of the transactions in the Workspace queue that CGW serves its members */
async function workspaceQueueTxIds({ id, session }: PendingWorkspace): Promise<string[]> {
  const queue = (await gatewayRequest(session, 'GET', `/v1/spaces/${id}/transactions/queued`)) as SpaceQueuedItemPage
  return Object.values(queue.results)
    .flatMap((chains) => Object.values(chains).flat())
    .flatMap((item) => ('transaction' in item ? [item.transaction.id] : []))
}

test.describe('Workspace Pending transactions', { tag: '@e2e' }, () => {
  test.slow()
  // The queue table is virtualized: a tall viewport renders every row, so row counts are the queue length
  test.use({ viewport: { width: 1280, height: 1600 } })

  test('should add a transaction that a proposer creates from the Workspace to its queue as waiting, and as signable by an owner', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const workspace = await seedPendingWorkspace(journey, safePage)

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    const pending = new WorkspaceTransactionsPage(safePage)
    await journey.connectAs('dave')
    await pending.goto(workspace.id)
    await expect(pending.rows).toHaveCount(9)
    await pending.newTransaction('Operations')
    await sendTokens.sendTokensButton.click()
    await sendTokens.fillTransfer({ recipient: workspace.recipient, amount: ETH.proposed })
    await sendTokens.nextButton.click()
    await review.propose()

    await expect(safePage).toHaveURL((url) => url.pathname === ROUTES.spacesTransactions)
    await expect
      .poll(async () => (await safeApiClient.getQueued(workspace.operations.address)).map(confirmationsOf))
      .toEqual([0])
    const [{ id: proposedTxId }] = await safeApiClient.getQueued(workspace.operations.address)
    await expect.poll(() => workspaceQueueTxIds(workspace)).toContain(proposedTxId)
    const proposed = pending.rows.filter({ hasText: ETH.proposed })
    await expect(pending.rows).toHaveCount(10)
    await expect(proposed).toContainText('0/2')
    await expect(proposed).toContainText('Waiting')

    await journey.connectAs('alice')

    await expect(pending.rows).toHaveCount(10)
    await expect(proposed).not.toContainText('Waiting')
    await expect(proposed.getByRole('button', { name: 'Sign' })).toBeVisible()
  })

  test('should update the signature count and status in the Workspace queue after an owner signs', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const workspace = await seedPendingWorkspace(journey, safePage)

    const pending = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await pending.goto(workspace.id)
    const transfer = pending.rows.filter({ hasText: ETH.treasury })
    await expect(pending.rows).toHaveCount(9)
    await expect(transfer).toContainText('1/3')
    const othersBefore = rowsWithout(await pending.rowStates(), ETH.treasury)
    await pending.sign(transfer)
    await review.sign()

    await expect
      .poll(async () => (await safeApiClient.getQueued(workspace.treasury.address)).map(confirmationsOf))
      .toEqual([2, 1])
    await expect(transfer).toContainText('2/3')
    await expect(transfer).toContainText('Waiting')
    await expect(pending.rows).toHaveCount(9)
    await expect.poll(async () => rowsWithout(await pending.rowStates(), ETH.treasury)).toEqual(othersBefore)
  })

  test('should remove an executed transaction from the Workspace queue and make the next one of its Safe executable', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const workspace = await seedPendingWorkspace(journey, safePage)

    const pending = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await pending.goto(workspace.id)
    const transfer = pending.rows.filter({ hasText: ETH.payroll })
    const batch = pending.rows.filter({ hasText: 'Batch' })
    await expect(pending.rows).toHaveCount(9)
    await expect(transfer).toContainText('2/2')
    await expect(batch).toContainText('Blocked')
    await expect(batch.getByTestId('execute-tx-btn')).toBeDisabled()
    const othersBefore = rowsWithout(await pending.rowStates(), 'Payroll')
    await pending.execute(transfer)
    await review.continueAndExecute()
    await review.waitForExecution()
    await review.finishButton.click()

    await expect.poll(() => safeApiClient.getNonce(workspace.payroll.address)).toBe(1)
    expect(await balanceOf(journey.env, workspace.recipient)).toBe(parseEther(ETH.payroll))
    await expect(pending.rows).toHaveCount(8)
    await expect(transfer).toHaveCount(0)
    await expect(batch).not.toContainText('Blocked')
    await expect(batch.getByTestId('execute-tx-btn')).toBeEnabled()
    await expect.poll(async () => rowsWithout(await pending.rowStates(), 'Payroll')).toEqual(othersBefore)
  })
})
