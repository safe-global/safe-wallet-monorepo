import { Wallet, parseEther } from 'ethers'
import { confirmationsOf } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { HomePage } from '../../src/pages/home.page'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const AMOUNT = '0.001'
const NOTE = 'Monthly payroll, batch 2'

test.describe('Confirm a transaction with a second owner', { tag: '@e2e' }, () => {
  test('should execute a transfer when a second owner confirms the signature of the first', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 2 })

    const sendTokens = new SendTokensPage(safePage)
    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.addNote(NOTE)
    await review.sign()

    await expect(review.viewTransactionLink).toHaveAttribute(
      'href',
      new RegExp(`id=multisig_${safe.address}_0x[0-9a-f]{64}`, 'i'),
    )
    const transactionPage = (await review.viewTransactionLink.getAttribute('href'))!
    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])

    await safePage.goto(transactionPage)
    await expect(safePage.getByText(NOTE)).toBeVisible()
    await expect(queue.transactions).toContainText(AMOUNT)

    await journey.connectAs('owner1')
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')
    await queue.confirm(0)
    await review.continueAndExecute()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })

  test('should leave the transfer fully signed in the queue when the last signer picks Sign over Execute', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['owner1', 'owner4'], threshold: 2 })
    await seedQueuedTransfer(safe, { nonce: 0, recipient: Wallet.createRandom().address, amount: AMOUNT })

    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')
    await queue.confirm(0)
    await review.continueAndChooseSign()
    await expect(review.lastSignatureNotice).toBeVisible()
    await review.signButton.click()

    await expect(safePage.getByRole('dialog')).toBeHidden()
    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([2])
    await expect(queue.transactionWithNonce(0)).toContainText('2/2')
    expect(await safeApiClient.getNonce(safe.address)).toBe(0)
  })
})
