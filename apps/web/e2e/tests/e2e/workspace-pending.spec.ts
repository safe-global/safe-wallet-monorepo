import { Wallet } from 'ethers'
import { confirmationsOf } from '../../src/api/transaction-items'
import { ROUTES } from '../../src/data/constants'
import {
  addWorkspaceSafes,
  createEmailSession,
  createWorkspace,
  gatewayRequest,
  signInWithEmail,
  uniqueEmail,
} from '../../src/fixtures/email-session'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { WorkspaceTransactionsPage } from '../../src/pages/workspace-transactions.page'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const AMOUNT = '0.001'
// The page polls the Workspace queue every 15 s, on top of the refetch after the user's own signature
const POLLED_UPDATE = { timeout: 35_000 }

test.describe('Workspace Pending transactions', { tag: '@e2e' }, () => {
  test('should list the pending transactions of every Safe in the Workspace with their signature counts', async ({
    safePage,
    journey,
  }) => {
    const treasury = await seedSafe(journey, { owners: ['bob', 'alice'], threshold: 2 })
    const payroll = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await seedQueuedTransfer(treasury, { nonce: 0, recipient: Wallet.createRandom().address, amount: AMOUNT })
    await seedQueuedTransfer(payroll, { nonce: 0, recipient: Wallet.createRandom().address, amount: AMOUNT })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: treasury, Payroll: payroll })

    const pending = new WorkspaceTransactionsPage(safePage)
    await pending.goto(workspaceId)

    await expect(pending.rows).toHaveCount(2)
    await expect(pending.queueTable).toContainText('Treasury')
    await expect(pending.queueTable).toContainText('Payroll')
    await expect(pending.rows.filter({ hasText: '1/2' })).toHaveCount(1)
    await expect(pending.rows.filter({ hasText: '1/1' })).toHaveCount(1)
  })

  test('should sign a transaction from its Workspace row and show the new signature count without a reload', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const treasury = await seedSafe(journey, { owners: ['bob', 'alice'], threshold: 2 })
    await seedQueuedTransfer(treasury, { nonce: 0, recipient: Wallet.createRandom().address, amount: AMOUNT })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: treasury })

    const pending = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await pending.goto(workspaceId)
    const row = pending.rows.first()
    await expect(row).toContainText('1/2')

    await pending.sign(row)
    await review.continueAndChooseSign()
    await review.signButton.click()

    await expect.poll(async () => (await safeApiClient.getQueued(treasury.address)).map(confirmationsOf)).toEqual([2])
    await expect(row).toContainText('2/2', POLLED_UPDATE)
    await expect(row.getByRole('button', { name: 'Execute' })).toBeVisible()
  })

  test('should not show the Workspace queue to a signed-in user who is not a member', async ({ safePage, journey }) => {
    const treasury = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await seedQueuedTransfer(treasury, { nonce: 0, recipient: Wallet.createRandom().address, amount: AMOUNT })
    const owner = await createEmailSession(uniqueEmail('workspace-owner'))
    const { uuid: workspaceId } = await createWorkspace(owner, 'Pending workspace')
    await addWorkspaceSafes(owner, workspaceId, [treasury.address])
    const outsider = await signInWithEmail(safePage, uniqueEmail('outsider'))

    await new WorkspaceTransactionsPage(safePage).goto(workspaceId)

    await expect(safePage).toHaveURL((url) => url.pathname === ROUTES.welcomeSpaces)
    await expect(gatewayRequest(outsider, 'GET', `/v1/spaces/${workspaceId}/transactions/queued`)).rejects.toThrow(
      /returned 40[134]/,
    )
  })
})
