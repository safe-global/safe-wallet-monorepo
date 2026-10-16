import { Wallet, parseEther } from 'ethers'
import { nativeAllowanceOf } from '../../src/chain/allowance'
import { balanceOf } from '../../src/chain/balances'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedAllowance } from '../../src/seed/allowance'
import { seedSafe } from '../../src/seed/safe'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

const ALLOWANCE = '0.1'
const AMOUNT = '0.01'

test.describe('Send with a spending limit', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should pay the recipient from the allowance without a Safe transaction when the beneficiary sends', async ({
    safePage,
    journey,
  }, testInfo) => {
    const recipient = Wallet.createRandom().address
    const beneficiary = journey.owners.owner4.address
    const safe = await seedSafe(journey, { threshold: 1 })
    await seedAllowance(safe, { delegate: beneficiary, amount: ALLOWANCE })
    const nonceBefore = await safe.context.safe.getNonce()
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.spendingLimitOption.click()
    await sendTokens.nextButton.click()
    await review.spendingLimitExecuteButton.click()

    await expect.poll(() => balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    const allowance = await nativeAllowanceOf(journey.env, { safe: safe.address, delegate: beneficiary })
    expect(allowance).toEqual({ amount: parseEther(ALLOWANCE), spent: parseEther(AMOUNT) })
    expect(await safe.context.safe.getNonce()).toBe(nonceBefore)

    await safePage.goto(`${ROUTES.settingsSetup}?safe=${safe.prefixedAddress}`)
    await expect(safePage.getByTestId('spent-amount')).toContainText(`${AMOUNT} of ${ALLOWANCE} ETH`)
  })
})
