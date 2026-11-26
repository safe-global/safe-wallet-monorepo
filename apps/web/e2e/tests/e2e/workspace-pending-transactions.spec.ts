import type { Page } from '@playwright/test'
import { parseEther } from 'ethers'
import { confirmationsOf, nonceOf, recipientsAtNonce, rejectionNonces } from '../../src/api/transaction-items'
import { allowanceOf } from '../../src/chain/allowance'
import { balanceOf } from '../../src/chain/balances'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { WorkspaceTransactionsPage } from '../../src/pages/workspace-transactions.page'
import { seedAllowance } from '../../src/seed/allowance'
import { seedProposer } from '../../src/seed/proposers'
import { seedQueuedTransfer, seedSafe, type SeededSafe } from '../../src/seed/safe'
import { seedSignedTransfer } from '../../src/seed/signatures'
import { waitForNativeBalance } from '../../src/seed/tokens'
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
  test('should queue a transfer without signatures when a proposer creates it from New', async ({
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
    await queue.startTransfer(SAFE_NAME)
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.propose()

    await expect.poll(() => safeApiClient.getQueued(safe.address)).toHaveLength(1)
    const [{ id: txId }] = await safeApiClient.getQueued(safe.address)
    const execution = (await safeApiClient.findTransaction(txId))?.detailedExecutionInfo
    expect(execution?.type === 'MULTISIG' && execution.proposedByDelegate?.value).toBe(journey.owners.dave.address)
    expect(execution?.type === 'MULTISIG' && execution.confirmations).toEqual([])
    await queue.goto(workspaceId)
    await expect(queue.row(0)).toBeVisible()
  })

  test('should queue a transfer with the signature of the owner who creates it from New', async ({
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
    await queue.startTransfer(SAFE_NAME)
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.sign()

    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])
    await queue.goto(workspaceId)
    await expect(queue.row(0)).toBeVisible()
  })

  test('should pay the recipient from the allowance when a spending limit beneficiary sends from New', async ({
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
  })
})

test.describe('Act on a transaction in the Workspace pending queue', { tag: '@e2e' }, () => {
  test('should add the signature of a second signer who signs from the table', async ({
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
    await queue.sign(0)
    await review.sign()

    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([2])
  })

  test('should execute a fully signed transfer when a non-owner executes it from the table', async ({
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
    await queue.execute(0)
    await review.continueAndExecuteDecliningSponsor()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })

  test('should execute an on-chain rejection at the nonce of the transfer when an owner rejects it from the table', async ({
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
    await queue.reject(0)
    await review.signAndExecuteDecliningSponsor()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    await expect.poll(() => safeApiClient.getQueued(safe.address)).toEqual([])
    await expect.poll(async () => rejectionNonces(await safeApiClient.getTransactionHistory(safe.address))).toEqual([0])
    expect(await balanceOf(journey.env, recipient)).toBe(0n)
    await queue.goto(workspaceId)
    await expect(queue.emptyQueue).toBeVisible()
  })

  test('should execute the replacement at the nonce of the original when an owner replaces it from the table', async ({
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
    await queue.replace(0)
    await sendTokens.fillTransfer({ recipient: newRecipient, amount: REPLACEMENT_AMOUNT })
    await sendTokens.nextButton.click()
    await review.signAndExecuteDecliningSponsor()

    await expect
      .poll(async () => recipientsAtNonce(await safeApiClient.getTransactionHistory(safe.address), 0))
      .toEqual([newRecipient])
    await expect.poll(() => safeApiClient.getQueued(safe.address)).toEqual([])
    expect(await balanceOf(journey.env, newRecipient)).toBe(parseEther(REPLACEMENT_AMOUNT))
    expect(await balanceOf(journey.env, recipient)).toBe(0n)
    await queue.goto(workspaceId)
    await expect(queue.emptyQueue).toBeVisible()
  })

  test('should remove the last queued transaction when its proposer deletes it from the table', async ({
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
    await queue.deleteFromQueue(1)

    await expect.poll(() => safeApiClient.findTransaction(last.txId)).toBeNull()
    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(nonceOf)).toEqual([0])
    await queue.goto(workspaceId)
    await expect(queue.row(0)).toBeVisible()
    await expect(queue.rows).toHaveCount(1)
  })
})
