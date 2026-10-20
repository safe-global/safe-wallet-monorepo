/**
 * A dApp connects to a Safe over WalletConnect and sends it requests, through the hosted relay.
 *
 * The test plays the dApp with a real WalletConnect client in the Playwright process, so it reads the responses
 * that a real dApp gets. Each test pairs its own dApp with its own 1/1 Safe of OWNER_4.
 */
import { Wallet, hashMessage, parseEther, toQuantity } from 'ethers'
import { test as base, expect } from '../../src/fixtures/journey.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { seedSafe, type SeededSafe } from '../../src/seed/safe'
import { balanceOf } from '../../src/chain/balances'
import { isValidSafeSignature } from '../../src/chain/signatures'
import { transactionsIn } from '../../src/api/transaction-items'
import { CHAIN_IDS, ROUTES } from '../../src/data/constants'
import { DAPP_NAME, WalletConnectDapp } from '../../src/api/walletconnect-dapp'
import { WalletConnectPage } from '../../src/pages/walletconnect.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { WalletPage } from '../../src/pages/wallet.page'

type WalletConnectFixtures = {
  safe: SeededSafe
  /** A dApp in a session that the Safe's owner approved */
  dapp: WalletConnectDapp
}

const test = base.extend<WalletConnectFixtures>({
  safe: async ({ journey }, provide) => {
    await provide(await seedSafe(journey, { threshold: 1 }))
  },

  dapp: async ({ safePage, safe }, provide, testInfo) => {
    const dapp = await WalletConnectDapp.start(CHAIN_IDS.sepolia)
    try {
      await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
      await new WalletPage(safePage).accountCenter.waitFor({ state: 'visible' })

      const walletConnect = new WalletConnectPage(safePage)
      await walletConnect.pair(await dapp.connect())
      await walletConnect.proposal(DAPP_NAME).waitFor({ state: 'visible' })
      await walletConnect.approveButton.click()
      await dapp.waitForSession()

      await provide(dapp)
    } finally {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('walletconnect-dapp-log', { body: dapp.log.join('\n'), contentType: 'text/plain' })
      }
      await dapp.close()
    }
  },
})

/** The JSON-RPC receipt that the wallet returns to the dApp */
type TransactionReceipt = { status: string }

/** What the wallet answers when the dApp asks for the receipt of `hash`; null while the transaction is not on chain. */
async function receiptOf(dapp: WalletConnectDapp, hash: string): Promise<TransactionReceipt | null> {
  const response = await dapp.request('eth_getTransactionReceipt', [hash])
  if ('error' in response) throw new Error(`eth_getTransactionReceipt failed: ${response.error.message}`)
  return response.result as TransactionReceipt | null
}

test.describe('WalletConnect', { tag: ['@e2e', '@walletconnect'] }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')
  // The hosted relay can drop a message; a second pairing tells that apart from a defect.
  test.describe.configure({ retries: 1 })

  test('should give the dApp the Safe account when the owner approves its session proposal', async ({
    safePage,
    safe,
    dapp,
  }) => {
    expect(dapp.accounts).toContain(`eip155:${CHAIN_IDS.sepolia}:${safe.address}`)

    const walletConnect = new WalletConnectPage(safePage)
    await walletConnect.open()
    await expect(walletConnect.session(DAPP_NAME)).toBeVisible()
  })

  test('should give the dApp a receipt of its transaction when the owner signs and executes it', async ({
    safePage,
    safe,
    dapp,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const value = parseEther('0.01')

    const response = dapp.request('eth_sendTransaction', [
      { from: safe.address, to: recipient, value: toQuantity(value), data: '0x' },
    ])
    const review = new TxReviewPage(safePage)
    await review.sign()
    await review.execute()

    // The signature answers the request with the safeTxHash; the dApp asks the wallet for the receipt of that hash.
    const answer = await response
    expect(answer).toEqual({ result: expect.stringMatching(/^0x[0-9a-f]{64}$/) })
    const { result: hash } = answer as { result: string }
    await expect.poll(async () => (await receiptOf(dapp, hash))?.status, { timeout: 60_000 }).toBe('0x1')

    expect(await balanceOf(journey.env, recipient)).toBe(value)
  })

  test('should give the dApp a signature that the Safe contract accepts when the owner signs its message', async ({
    safePage,
    safe,
    dapp,
    journey,
  }) => {
    const message = `Safe E2E WalletConnect message ${Date.now()}`

    const response = dapp.request('personal_sign', [message, safe.address])
    await new TxReviewPage(safePage).signMessage()

    const answer = await response
    expect(answer).toEqual({ result: expect.stringMatching(/^0x[0-9a-f]+$/) })
    const { result: signature } = answer as { result: string }
    expect(
      await isValidSafeSignature(journey.env, { safeAddress: safe.address, hash: hashMessage(message), signature }),
    ).toBe(true)
  })

  test('should return a user rejection to the dApp when the owner discards its transaction', async ({
    safePage,
    safeApiClient,
    safe,
    dapp,
  }) => {
    const response = dapp.request('eth_sendTransaction', [
      { from: safe.address, to: Wallet.createRandom().address, value: '0x1', data: '0x' },
    ])
    await new TxReviewPage(safePage).discard()

    expect(await response).toEqual({ error: { code: 4001, message: expect.any(String) } })
    expect(transactionsIn(await safeApiClient.getQueuedTransactions(safe.address))).toEqual([])
  })

  test('should end the dApp session when the owner disconnects it', async ({ safePage, dapp }) => {
    const walletConnect = new WalletConnectPage(safePage)
    await walletConnect.disconnect(DAPP_NAME)

    await dapp.waitForSessionDelete()
    await expect(walletConnect.session(DAPP_NAME)).toHaveCount(0)
  })
})
