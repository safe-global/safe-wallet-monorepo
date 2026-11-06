import { Wallet, parseEther, parseUnits } from 'ethers'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { balanceOf, tokenBalanceOf } from '../../src/chain/balances'
import { DrainAccountPage } from '../../src/pages/drain-account.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe } from '../../src/seed/safe'
import { SEPOLIA_USDC, seedTokenBalance } from '../../src/seed/tokens'

const SEEDED_ETH = parseEther('1')
const USDC_BALANCE = parseUnits('25', SEPOLIA_USDC.decimals)

test.describe('Drain Account', { tag: '@e2e' }, () => {
  test('should move every asset of the Safe to the recipient when an owner signs and executes the drain', async ({
    safePage,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: USDC_BALANCE })

    const drain = new DrainAccountPage(safePage)
    const review = new TxReviewPage(safePage)
    await drain.open(safe.prefixedAddress)
    await drain.transferEverythingTo(recipient)
    await review.signAndExecute()

    await expect.poll(() => balanceOf(journey.env, recipient)).toBe(SEEDED_ETH)
    await expect
      .poll(() => tokenBalanceOf(journey.env, { token: SEPOLIA_USDC.address, holder: recipient }))
      .toBe(USDC_BALANCE)
    expect(await balanceOf(journey.env, safe.address)).toBe(0n)
  })
})
