import { Wallet, parseUnits } from 'ethers'
import { erc20TransfersIn } from '../../src/api/transaction-items'
import { tokenBalanceOf } from '../../src/chain/balances'
import { HomePage } from '../../src/pages/home.page'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { SEPOLIA_USDC, seedTokenBalance } from '../../src/seed/tokens'
import { AssetsPage } from '../../src/pages/assets.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const BALANCE = '10'
const AMOUNT = '1.5'
const BALANCE_AFTER = '8.5'

test.describe('Send an ERC-20 token', { tag: '@e2e' }, () => {
  test('should move the token and list an outgoing ERC-20 transfer when an owner sends USDC', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { address: usdc, decimals, symbol } = SEPOLIA_USDC
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })
    await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: parseUnits(BALANCE, decimals) })

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    await sendTokens.selectToken(symbol)
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.signAndExecute()

    await expect
      .poll(() => tokenBalanceOf(journey.env, { token: usdc, holder: recipient }))
      .toBe(parseUnits(AMOUNT, decimals))
    expect(await tokenBalanceOf(journey.env, { token: usdc, holder: safe.address })).toBe(
      parseUnits(BALANCE_AFTER, decimals),
    )
    await expect
      .poll(async () => erc20TransfersIn(await safeApiClient.getTransactionHistory(safe.address)))
      .toContainEqual({ tokenAddress: usdc, value: parseUnits(AMOUNT, decimals).toString(), direction: 'OUTGOING' })

    const assets = new AssetsPage(safePage)
    await assets.goto(safe.prefixedAddress)
    // The local stack has no USDC price, so its fiat value is 0 and the table hides it as a small balance.
    await assets.setHideSmallBalances(false)
    await expect(assets.tokenRows.filter({ hasText: symbol })).toContainText(BALANCE_AFTER)
  })
})
