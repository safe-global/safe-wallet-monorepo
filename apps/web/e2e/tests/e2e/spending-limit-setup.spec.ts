import { parseUnits } from 'ethers'
import { allowanceOf } from '../../src/chain/allowance'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { SpendingLimitsPage } from '../../src/pages/spending-limits.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe } from '../../src/seed/safe'
import { SEPOLIA_COW, SEPOLIA_USDC, seedKnownToken } from '../../src/seed/tokens'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const AMOUNT = '5'

test.describe('Set up a spending limit', { tag: '@e2e' }, () => {
  test('should set a spending limit on a pasted token the Safe does not hold', async ({ safePage, journey }) => {
    const { address: cow, decimals, symbol } = SEPOLIA_COW
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await seedKnownToken(journey.env, SEPOLIA_COW)
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })
    const beneficiary = journey.newAddress()

    const spendingLimits = new SpendingLimitsPage(safePage)
    const review = new TxReviewPage(safePage)
    await spendingLimits.goto(safe.prefixedAddress, workspaceId)
    await spendingLimits.startLimit(beneficiary)
    await spendingLimits.tokenSelector.pickPastedToken(SEPOLIA_COW)
    await spendingLimits.finishLimit(AMOUNT)
    await review.signAndExecuteDecliningSponsor()
    await review.waitForIndexing()

    await expect
      .poll(() => allowanceOf(journey.env, { safe: safe.address, delegate: beneficiary, token: cow }))
      .toEqual({ amount: parseUnits(AMOUNT, decimals), spent: 0n })
    await spendingLimits.goto(safe.prefixedAddress, workspaceId)
    await expect(spendingLimits.spentAmounts).toContainText(`0 of ${AMOUNT} ${symbol}`)
  })

  test('should set a spending limit on a popular token the Safe does not hold', async ({ safePage, journey }) => {
    const { address: usdc, decimals, symbol } = SEPOLIA_USDC
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await seedKnownToken(journey.env, SEPOLIA_USDC)
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })
    const beneficiary = journey.newAddress()

    const spendingLimits = new SpendingLimitsPage(safePage)
    await spendingLimits.goto(safe.prefixedAddress, workspaceId)
    await spendingLimits.startLimit(beneficiary)
    await spendingLimits.tokenSelector.pickPopularToken(symbol)
    await spendingLimits.finishLimit('1.5')
    await new TxReviewPage(safePage).signAndExecuteDecliningSponsor()

    await expect
      .poll(() => allowanceOf(journey.env, { safe: safe.address, delegate: beneficiary, token: usdc }))
      .toEqual({ amount: parseUnits('1.5', decimals), spent: 0n })
  })

  test('should offer no token for a pasted address the Transaction Service does not know', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: safe })
    const notAToken = journey.newAddress()

    const spendingLimits = new SpendingLimitsPage(safePage)
    await spendingLimits.goto(safe.prefixedAddress, workspaceId)
    await spendingLimits.startLimit(journey.newAddress())
    await spendingLimits.tokenSelector.paste(notAToken)

    await expect(spendingLimits.tokenSelector.tokenUnknown).toBeVisible()
    await expect(spendingLimits.tokenSelector.customTokenGroup.getByRole('option')).toHaveCount(0)
  })
})
