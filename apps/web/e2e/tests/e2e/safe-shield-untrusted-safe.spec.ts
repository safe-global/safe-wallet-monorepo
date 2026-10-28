import { Wallet, parseEther } from 'ethers'
import { balanceOf } from '../../src/chain/balances'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SafeShieldPage } from '../../src/pages/safe-shield.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe } from '../../src/seed/safe'

const AMOUNT = '0.001'

test.describe('Safe Shield untrusted Safe check', { tag: '@e2e' }, () => {
  test('should ask to confirm the risk before signing when the Safe is not in the accounts', async ({
    safePage,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1, inAccounts: false })

    const sendTokens = new SendTokensPage(safePage)
    const safeShield = new SafeShieldPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()

    await expect(review.riskConfirmation).toBeVisible()
    await expect(safeShield.untrustedSafeFinding).toBeVisible()
    await expect(review.continueButton).toBeDisabled()

    await review.confirmRisk()
    await review.signAndExecute()

    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })
})
