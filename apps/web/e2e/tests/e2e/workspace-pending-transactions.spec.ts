import type { Page } from '@playwright/test'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Wallet, parseEther, parseUnits } from 'ethers'
import { confirmationsOf, nonceOf, recipientsAtNonce, rejectionNonces } from '../../src/api/transaction-items'
import { allowanceOf } from '../../src/chain/allowance'
import { balanceOf } from '../../src/chain/balances'
import { ROUTES } from '../../src/data/constants'
import { gatewayRequest, type EmailSession } from '../../src/fixtures/email-session'
import { test, expect, type Journey } from '../../src/fixtures/journey.fixture'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { WorkspaceTransactionsPage } from '../../src/pages/workspace-transactions.page'
import { seedAllowance } from '../../src/seed/allowance'
import { seedProposer } from '../../src/seed/proposers'
import {
  ethTransfer,
  seedQueuedTokenTransfer,
  seedQueuedTransfer,
  seedSafe,
  type SafeSetup,
  type SeededSafe,
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

const SAFE_NAME = 'Treasury'
const AMOUNT = '0.001'
const REPLACEMENT_AMOUNT = '0.002'
const ALLOWANCE = '0.1'

/** Puts the Safe in a new Business Workspace and returns its ID */
async function seedWorkspaceQueue(page: Page, safe: SeededSafe): Promise<string> {
  const { id } = await seedBusinessWorkspace(page, { [SAFE_NAME]: safe })
  return id
}

test.describe('Create a transaction from the Workspace pending queue', { tag: '@e2e' }, () => {
  test('should show a transfer that a proposer creates from New as waiting, and as signable by an owner', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 1 })
    await seedProposer(safe, { delegate: journey.owners.dave, delegator: journey.owners.alice })
    await waitForNativeBalance(safe)
    const workspaceId = await seedWorkspaceQueue(safePage, safe)
    const recipient = journey.newAddress()

    const queue = new WorkspaceTransactionsPage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await journey.connectAs('dave')
    await queue.goto(workspaceId)
    await expect(queue.emptyQueue).toBeVisible()
    await queue.startTransfer(SAFE_NAME)
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.propose()

    await expect.poll(() => safeApiClient.getQueued(safe.address)).toHaveLength(1)
    const [{ id: txId }] = await safeApiClient.getQueued(safe.address)
    const execution = (await safeApiClient.findTransaction(txId))?.detailedExecutionInfo
    expect(execution?.type === 'MULTISIG' && execution.proposedByDelegate?.value).toBe(journey.owners.dave.address)
    expect(execution?.type === 'MULTISIG' && execution.confirmations).toEqual([])
    await expect(queue.rows).toHaveCount(1)
    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Waiting on others. 0 of 1 signature')

    await journey.connectAs('alice')

    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Ready to sign. 0 of 1 signature')
    await expect(queue.row(0).getByRole('button', { name: 'Sign', exact: true })).toBeEnabled()
  })

  test('should show a transfer that an owner creates from New with their signature, waiting on the others', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
    await waitForNativeBalance(safe)
    const workspaceId = await seedWorkspaceQueue(safePage, safe)
    const recipient = journey.newAddress()

    const queue = new WorkspaceTransactionsPage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(workspaceId)
    await expect(queue.emptyQueue).toBeVisible()
    await queue.startTransfer(SAFE_NAME)
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.sign()

    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])
    await expect(queue.rows).toHaveCount(1)
    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Waiting on others. 1 of 2 signatures')
  })

  test('should pay the recipient from the allowance, without queueing a transaction, when a spending limit beneficiary sends from New', async ({
    safePage,
    journey,
  }) => {
    const beneficiary = journey.owners.dave.address
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 1 })
    await seedAllowance(safe, { delegate: beneficiary, amount: parseEther(ALLOWANCE) })
    await waitForNativeBalance(safe)
    const workspaceId = await seedWorkspaceQueue(safePage, safe)
    const recipient = journey.newAddress()
    const nonceBefore = await safe.context.safe.getNonce()

    const queue = new WorkspaceTransactionsPage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await journey.connectAs('dave')
    await queue.goto(workspaceId)
    await queue.startTransfer(SAFE_NAME)
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.spendingLimitOption.click()
    await sendTokens.nextButton.click()
    await review.spendingLimitExecuteButton.click()

    await expect.poll(() => balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await allowanceOf(journey.env, { safe: safe.address, delegate: beneficiary })).toEqual({
      amount: parseEther(ALLOWANCE),
      spent: parseEther(AMOUNT),
    })
    expect(await safe.context.safe.getNonce()).toBe(nonceBefore)
    await queue.goto(workspaceId)
    await expect(queue.emptyQueue).toBeVisible()
  })
})

test.describe('Act on a transaction in the Workspace pending queue', { tag: '@e2e' }, () => {
  test('should update the row of a transaction that a second signer signs from the table', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob', 'carol'], threshold: 3 })
    await seedQueuedTransfer(safe, { nonce: 0, recipient: journey.newAddress(), amount: AMOUNT })
    const workspaceId = await seedWorkspaceQueue(safePage, safe)

    const queue = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await journey.connectAs('bob')
    await queue.goto(workspaceId)
    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Ready to sign. 1 of 3 signatures')
    await queue.sign(queue.row(0))
    await review.sign()

    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([2])
    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Waiting on others. 2 of 3 signatures')
    await expect(queue.rows).toHaveCount(1)
  })

  test('should execute a fully signed transfer that a non-owner executes from the table, and drop its row', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
    const recipient = journey.newAddress()
    await seedSignedTransfer(journey, safe, { nonce: 0, recipient, amount: AMOUNT })
    const workspaceId = await seedWorkspaceQueue(safePage, safe)

    const queue = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await journey.connectAs('dave')
    await queue.goto(workspaceId)
    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Ready to execute. 2 of 2 signatures')
    await queue.execute(queue.row(0))
    await review.continueAndExecuteDecliningSponsor()
    await review.waitForExecution()
    await review.finishButton.click()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await expect(queue.emptyQueue).toBeVisible()
  })

  test('should execute an on-chain rejection at the nonce of the transfer that an owner rejects from the table', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 1 })
    const recipient = journey.newAddress()
    await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: AMOUNT })
    const workspaceId = await seedWorkspaceQueue(safePage, safe)

    const queue = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(workspaceId)
    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Ready to execute. 1 of 1 signature')
    await queue.reject(0)
    await review.signAndExecuteDecliningSponsor()
    await review.finishButton.click()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    await expect.poll(() => safeApiClient.getQueued(safe.address)).toEqual([])
    await expect.poll(async () => rejectionNonces(await safeApiClient.getTransactionHistory(safe.address))).toEqual([0])
    expect(await balanceOf(journey.env, recipient)).toBe(0n)
    await expect(queue.emptyQueue).toBeVisible()
  })

  test('should execute the replacement at the nonce of the transfer that an owner replaces from the table', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 1 })
    const [recipient, newRecipient] = [journey.newAddress(), journey.newAddress()]
    await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: AMOUNT })
    const workspaceId = await seedWorkspaceQueue(safePage, safe)

    const queue = new WorkspaceTransactionsPage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(workspaceId)
    await expect(queue.rows).toHaveCount(1)
    await queue.replace(0)
    await sendTokens.fillTransfer({ recipient: newRecipient, amount: REPLACEMENT_AMOUNT })
    await sendTokens.nextButton.click()
    await review.signAndExecuteDecliningSponsor()
    await review.finishButton.click()

    await expect
      .poll(async () => recipientsAtNonce(await safeApiClient.getTransactionHistory(safe.address), 0))
      .toEqual([newRecipient])
    await expect.poll(() => safeApiClient.getQueued(safe.address)).toEqual([])
    expect(await balanceOf(journey.env, newRecipient)).toBe(parseEther(REPLACEMENT_AMOUNT))
    expect(await balanceOf(journey.env, recipient)).toBe(0n)
    await expect(queue.emptyQueue).toBeVisible()
  })

  test('should drop the row of the last queued transaction that its proposer deletes from the table', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 2 })
    const recipient = journey.newAddress()
    await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: AMOUNT })
    const last = await seedQueuedTransfer(safe, { nonce: 1, recipient, amount: AMOUNT })
    const workspaceId = await seedWorkspaceQueue(safePage, safe)

    const queue = new WorkspaceTransactionsPage(safePage)
    await queue.goto(workspaceId)
    await expect(queue.rows).toHaveCount(2)
    await queue.deleteFromQueue(1)

    await expect.poll(() => safeApiClient.findTransaction(last.txId)).toBeNull()
    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(nonceOf)).toEqual([0])
    await expect(queue.rows).toHaveCount(1)
    await expect(queue.row(1)).toHaveCount(0)
    await expect(queue.signatures(queue.row(0))).toHaveAccessibleName('Waiting on others. 1 of 2 signatures')
  })
})

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

/** A Safe with an ETH transfer at #0 and a USDC transfer at #1, both signed by its first owner */
async function seedSafeWithTransfers(
  journey: Journey,
  setup: SafeSetup,
  token: SeedToken,
  transfers: { recipient: string; eth: string; usdc: string },
): Promise<SeededSafe> {
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
  const treasury = await seedSafeWithTransfers(
    journey,
    { owners: ['carol', 'alice', 'bob'], threshold: 3 },
    SEPOLIA_USDC,
    { recipient, eth: ETH.treasury, usdc: USDC.treasury },
  )

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

/** 9 pending transactions on 5 Safes across Sepolia, Ethereum and Polygon */
async function seedPendingWorkspace(journey: Journey, page: Page): Promise<PendingWorkspace> {
  const recipient = Wallet.createRandom().address
  const [sepolia, reserve, grants] = await Promise.all([
    seedSepoliaSafes(journey, recipient),
    seedSafeWithTransfers(journey, { owners: ['alice'], threshold: 1, network: 'ethereum' }, ETHEREUM_USDC, {
      recipient,
      eth: ETH.reserve,
      usdc: USDC.reserve,
    }),
    seedSafeWithTransfers(journey, { owners: ['alice', 'bob'], threshold: 2, network: 'polygon' }, POLYGON_USDC, {
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

test.describe('Workspace pending queue across networks', { tag: '@e2e' }, () => {
  test.slow()
  // The queue table is virtualized: a tall viewport renders every row, so row counts are the queue length
  test.use({ viewport: { width: 1280, height: 1600 } })

  test('should add a transaction that a proposer creates from New to a queue of Safes on several networks', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const workspace = await seedPendingWorkspace(journey, safePage)

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    const queue = new WorkspaceTransactionsPage(safePage)
    await journey.connectAs('dave')
    await queue.goto(workspace.id)
    await expect(queue.rows).toHaveCount(9)
    await queue.startTransfer('Operations')
    await sendTokens.fillTransfer({ recipient: workspace.recipient, amount: ETH.proposed })
    await sendTokens.nextButton.click()
    await review.propose()

    await expect(safePage).toHaveURL((url) => url.pathname === ROUTES.spacesTransactions)
    await expect
      .poll(async () => (await safeApiClient.getQueued(workspace.operations.address)).map(confirmationsOf))
      .toEqual([0])
    const [{ id: proposedTxId }] = await safeApiClient.getQueued(workspace.operations.address)
    await expect.poll(() => workspaceQueueTxIds(workspace)).toContain(proposedTxId)
    const proposed = queue.rows.filter({ hasText: ETH.proposed })
    await expect(queue.rows).toHaveCount(10)
    await expect(queue.signatures(proposed)).toHaveAccessibleName('Waiting on others. 0 of 2 signatures')

    await journey.connectAs('alice')

    await expect(queue.rows).toHaveCount(10)
    await expect(queue.signatures(proposed)).toHaveAccessibleName('Ready to sign. 0 of 2 signatures')
    await expect(proposed.getByRole('button', { name: 'Sign', exact: true })).toBeEnabled()
  })

  test('should update only the signed row when an owner signs in a queue of Safes on several networks', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const workspace = await seedPendingWorkspace(journey, safePage)

    const queue = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(workspace.id)
    const transfer = queue.rows.filter({ hasText: ETH.treasury })
    await expect(queue.rows).toHaveCount(9)
    await expect(queue.signatures(transfer)).toHaveAccessibleName('Ready to sign. 1 of 3 signatures')
    const othersBefore = rowsWithout(await queue.rowStates(), ETH.treasury)
    await queue.sign(transfer)
    await review.sign()

    await expect
      .poll(async () => (await safeApiClient.getQueued(workspace.treasury.address)).map(confirmationsOf))
      .toEqual([2, 1])
    await expect(queue.signatures(transfer)).toHaveAccessibleName('Waiting on others. 2 of 3 signatures')
    await expect(queue.rows).toHaveCount(9)
    await expect.poll(async () => rowsWithout(await queue.rowStates(), ETH.treasury)).toEqual(othersBefore)
  })

  test('should drop an executed transaction and unblock the next one of its Safe in a queue of Safes on several networks', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const workspace = await seedPendingWorkspace(journey, safePage)

    const queue = new WorkspaceTransactionsPage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(workspace.id)
    const transfer = queue.rows.filter({ hasText: ETH.payroll })
    const batch = queue.rows.filter({ hasText: 'Batch' })
    await expect(queue.rows).toHaveCount(9)
    await expect(queue.signatures(transfer)).toHaveAccessibleName('Ready to execute. 2 of 2 signatures')
    await expect(queue.signatures(batch)).toHaveAccessibleName(/^Blocked/)
    await expect(batch.getByTestId('execute-tx-btn')).toBeDisabled()
    const othersBefore = rowsWithout(await queue.rowStates(), 'Payroll')
    await queue.execute(transfer)
    await review.continueAndExecute()
    await review.waitForExecution()
    await review.finishButton.click()

    await expect.poll(() => safeApiClient.getNonce(workspace.payroll.address)).toBe(1)
    expect(await balanceOf(journey.env, workspace.recipient)).toBe(parseEther(ETH.payroll))
    await expect(queue.rows).toHaveCount(8)
    await expect(transfer).toHaveCount(0)
    await expect(queue.signatures(batch)).toHaveAccessibleName('Ready to execute. 2 of 2 signatures')
    await expect(batch.getByTestId('execute-tx-btn')).toBeEnabled()
    await expect.poll(async () => rowsWithout(await queue.rowStates(), 'Payroll')).toEqual(othersBefore)
  })
})
