import { Wallet, parseEther, parseUnits } from 'ethers'
import { confirmationsOf, nonceOf } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
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
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { WorkspaceTransactionsPage } from '../../src/pages/workspace-transactions.page'
import { seedProposer } from '../../src/seed/proposers'
import { seedQueuedTokenTransfer, seedQueuedTransaction, seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { seedSignedTransfer } from '../../src/seed/signatures'
import { POLYGON_USDC, SEPOLIA_USDC, seedTokenBalance, waitForNativeBalance } from '../../src/seed/tokens'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const AMOUNT = '0.001'
const USDC_AMOUNT = parseUnits('5', 6)
// The page polls the Workspace queue every 15 s, on top of the refetch after the user's own signature
const POLLED_UPDATE = { timeout: 35_000 }

const ethTransfer = (recipient: string) => ({ to: recipient, value: parseEther(AMOUNT).toString(), data: '0x' })

test.describe('Workspace Pending transactions', { tag: '@e2e' }, () => {
  test('should list the ERC-20, ETH and MultiSend transactions queued on Sepolia, Ethereum and Polygon Safes of the Workspace', async ({
    safePage,
    journey,
  }) => {
    test.slow()
    const recipient = Wallet.createRandom().address
    const treasury = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
    const operations = await seedSafe(journey, { owners: ['alice'], threshold: 1, network: 'ethereum' })
    const grants = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2, network: 'polygon' })
    await seedTokenBalance(treasury, { token: SEPOLIA_USDC, amount: USDC_AMOUNT })
    await seedTokenBalance(grants, { token: POLYGON_USDC, amount: USDC_AMOUNT })
    await seedQueuedTokenTransfer(treasury, { nonce: 0, token: SEPOLIA_USDC.address, recipient, amount: USDC_AMOUNT })
    await seedQueuedTransaction(treasury, { nonce: 1, transactions: [ethTransfer(recipient), ethTransfer(recipient)] })
    await seedQueuedTransfer(operations, { nonce: 0, recipient, amount: AMOUNT })
    await seedQueuedTransfer(grants, { nonce: 0, recipient, amount: AMOUNT })
    await seedQueuedTokenTransfer(grants, { nonce: 1, token: POLYGON_USDC.address, recipient, amount: USDC_AMOUNT })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, {
      Treasury: treasury,
      Operations: operations,
      Grants: grants,
    })

    const pending = new WorkspaceTransactionsPage(safePage)
    await pending.goto(workspaceId)

    await expect(pending.networkSection('Sepolia')).toBeVisible()
    await expect(pending.networkSection('Ethereum')).toBeVisible()
    await expect(pending.networkSection('Polygon')).toBeVisible()
    await expect(pending.rows).toHaveCount(5)
    await expect(pending.queueTable).toContainText('Treasury')
    await expect(pending.queueTable).toContainText('Operations')
    await expect(pending.queueTable).toContainText('Grants')
    await expect(pending.rows.filter({ hasText: 'USDC' })).toHaveCount(2)
    await expect(pending.rows.filter({ hasText: 'Batch' })).toHaveCount(1)
    await expect(pending.rows.filter({ hasText: '1/2' })).toHaveCount(4)
    await expect(pending.rows.filter({ hasText: '1/1' })).toHaveCount(1)
  })

  test('should show a transaction that a proposer proposed as waiting for signatures, and as signable by an owner', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
    await seedProposer(safe, { delegate: journey.owners.dave, delegator: journey.owners.alice })
    await waitForNativeBalance(safe)
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    const pending = new WorkspaceTransactionsPage(safePage)
    await journey.connectAs('dave')
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient: Wallet.createRandom().address, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.propose()
    await pending.goto(workspaceId)
    const row = pending.rows.first()

    await expect(pending.rows).toHaveCount(1, POLLED_UPDATE)
    await expect(row).toContainText('0/2')
    await expect(row).toContainText('Waiting')

    await journey.connectAs('alice')

    await expect(row).toContainText('0/2')
    await expect(row).not.toContainText('Waiting')
    await expect(row.getByRole('button', { name: 'Sign' })).toBeVisible()
  })

  test('should update the signature count and status of a row after each of two owners signs from the Workspace', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['carol', 'alice', 'bob'], threshold: 3 })
    await seedQueuedTransfer(safe, { nonce: 0, recipient: Wallet.createRandom().address, amount: AMOUNT })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const pending = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await pending.goto(workspaceId)
    const row = pending.rows.first()
    await expect(row).toContainText('1/3')
    await pending.sign(row)
    await review.sign()

    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([2])
    await expect(row).toContainText('2/3', POLLED_UPDATE)
    await expect(row).toContainText('Waiting')

    await journey.connectAs('bob')
    await expect(row).toContainText('2/3')
    await pending.sign(row)
    await review.continueAndChooseSign()
    await review.signButton.click()

    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([3])
    await expect(row).toContainText('3/3', POLLED_UPDATE)
    await expect(row.getByTestId('execute-tx-btn')).toBeVisible()
  })

  test('should remove a fully signed transaction from the Workspace queue once an owner executes it from its row', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
    await seedSignedTransfer(journey, safe, { nonce: 0, recipient, amount: AMOUNT })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const pending = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await pending.goto(workspaceId)
    const row = pending.rows.first()
    await expect(row).toContainText('2/2')
    await pending.execute(row)
    await review.continueAndExecute()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await pending.goto(workspaceId)
    await expect(pending.emptyQueue).toBeVisible()
  })

  test('should keep only the unexecuted transactions in the Workspace queue after an owner bulk executes on one Safe', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const treasury = await seedSafe(journey, { owners: ['alice', 'bob', 'carol'], threshold: 2 })
    const payroll = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
    await seedSignedTransfer(journey, treasury, { nonce: 0, recipient, amount: AMOUNT })
    await seedSignedTransfer(journey, treasury, { nonce: 1, recipient, amount: AMOUNT })
    await seedQueuedTransfer(treasury, { nonce: 2, recipient, amount: AMOUNT })
    await seedQueuedTransfer(payroll, { nonce: 0, recipient, amount: AMOUNT })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: treasury, Payroll: payroll })

    const pending = new WorkspaceTransactionsPage(safePage)
    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await pending.goto(workspaceId)
    await expect(pending.rows).toHaveCount(4)
    await queue.goto(treasury.prefixedAddress)
    await queue.bulkExecuteButton.click()
    await review.executeBulk()

    await expect.poll(() => safeApiClient.getNonce(treasury.address)).toBe(2)
    await expect.poll(async () => (await safeApiClient.getQueued(treasury.address)).map(nonceOf)).toEqual([2])
    await pending.goto(workspaceId)
    await expect(pending.rows).toHaveCount(2)
    await expect(pending.rows.filter({ hasText: '2/2' })).toHaveCount(0)
    await expect(pending.rows.filter({ hasText: '1/2' })).toHaveCount(2)
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
