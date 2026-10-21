import { type Page } from '@playwright/test'
import { Wallet, parseEther, parseUnits } from 'ethers'
import { allowanceOf } from '../../src/chain/allowance'
import { balanceOf, tokenBalanceOf } from '../../src/chain/balances'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedAllowance } from '../../src/seed/allowance'
import { seedSafe } from '../../src/seed/safe'
import { SEPOLIA_USDC, seedTokenBalance } from '../../src/seed/tokens'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

const ALLOWANCE = '0.1'
const AMOUNT = '0.01'
const USDC_BALANCE = '10'
const USDC_ALLOWANCE = '5'
const USDC_AMOUNT = '1.5'

/** As the beneficiary, send `amount` of the token `symbol` (ETH when omitted) with the spending-limit option */
async function sendFromAllowance(
  page: Page,
  { safe, recipient, amount, symbol }: { safe: string; recipient: string; amount: string; symbol?: string },
): Promise<void> {
  const sendTokens = new SendTokensPage(page)
  await page.goto(`${ROUTES.home}?safe=${safe}`)
  await sendTokens.open()
  if (symbol) await sendTokens.selectToken(symbol)
  await sendTokens.fillTransfer({ recipient, amount })
  await sendTokens.spendingLimitOption.click()
  await sendTokens.nextButton.click()
  await new TxReviewPage(page).spendingLimitExecuteButton.click()
}

test.describe('Send with a spending limit', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should pay the recipient from the allowance without a Safe transaction when the beneficiary sends', async ({
    safePage,
    journey,
  }, testInfo) => {
    const recipient = Wallet.createRandom().address
    const beneficiary = journey.owners.owner4.address
    const safe = await seedSafe(journey, { threshold: 1 })
    await seedAllowance(safe, { delegate: beneficiary, amount: parseEther(ALLOWANCE) })
    const nonceBefore = await safe.context.safe.getNonce()
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    await sendFromAllowance(safePage, { safe: safe.prefixedAddress, recipient, amount: AMOUNT })

    await expect.poll(() => balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    const allowance = await allowanceOf(journey.env, { safe: safe.address, delegate: beneficiary })
    expect(allowance).toEqual({ amount: parseEther(ALLOWANCE), spent: parseEther(AMOUNT) })
    expect(await safe.context.safe.getNonce()).toBe(nonceBefore)

    await safePage.goto(`${ROUTES.settingsSetup}?safe=${safe.prefixedAddress}`)
    await expect(safePage.getByTestId('spent-amount')).toContainText(`${AMOUNT} of ${ALLOWANCE} ETH`)
  })

  test('should pay the recipient from a USDC allowance without a Safe transaction when the beneficiary sends', async ({
    safePage,
    journey,
  }, testInfo) => {
    const { address: usdc, decimals, symbol } = SEPOLIA_USDC
    const recipient = Wallet.createRandom().address
    const beneficiary = journey.owners.owner4.address
    const safe = await seedSafe(journey, { threshold: 1 })
    await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: parseUnits(USDC_BALANCE, decimals) })
    await seedAllowance(safe, { delegate: beneficiary, amount: parseUnits(USDC_ALLOWANCE, decimals), token: usdc })
    const nonceBefore = await safe.context.safe.getNonce()
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    await sendFromAllowance(safePage, { safe: safe.prefixedAddress, recipient, amount: USDC_AMOUNT, symbol })

    await expect
      .poll(() => tokenBalanceOf(journey.env, { token: usdc, holder: recipient }))
      .toBe(parseUnits(USDC_AMOUNT, decimals))
    const allowance = await allowanceOf(journey.env, { safe: safe.address, delegate: beneficiary, token: usdc })
    expect(allowance).toEqual({
      amount: parseUnits(USDC_ALLOWANCE, decimals),
      spent: parseUnits(USDC_AMOUNT, decimals),
    })
    expect(await safe.context.safe.getNonce()).toBe(nonceBefore)

    await safePage.goto(`${ROUTES.settingsSetup}?safe=${safe.prefixedAddress}`)
    await expect(safePage.getByTestId('spent-amount')).toContainText(`${USDC_AMOUNT} of ${USDC_ALLOWANCE} ${symbol}`)
  })
})
