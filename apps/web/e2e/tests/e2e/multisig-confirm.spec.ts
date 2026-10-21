import { Wallet, parseEther } from 'ethers'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { WalletPage } from '../../src/pages/wallet.page'
import { ROUTES } from '../../src/data/constants'

const AMOUNT = '0.001'

function confirmationsOfQueued(queue: QueuedItemPage): Array<number | undefined> {
  return transactionsIn(queue).map((tx) =>
    tx.executionInfo?.type === 'MULTISIG' ? tx.executionInfo.confirmationsSubmitted : undefined,
  )
}

test.describe('Confirm a transaction with a second owner', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should execute a transfer when a second owner confirms the signature of the first', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { threshold: 2 })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const wallet = new WalletPage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.sign()

    await expect
      .poll(async () => confirmationsOfQueued(await safeApiClient.getQueuedTransactions(safe.address)))
      .toEqual([1])

    await queue.goto(safe.prefixedAddress)
    await wallet.disconnect()
    await wallet.connectWallet(journey.owners.owner1.privateKey)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')
    await queue.confirm(0)
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect.poll(async () => (await safeApiClient.getSafeInfo(safe.address)).nonce).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })
})
