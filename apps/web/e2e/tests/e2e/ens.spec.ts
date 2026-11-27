import { Wallet, parseEther } from 'ethers'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { setEnsName } from '../../environment/scenarios/ens.mjs'
import { transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { HomePage } from '../../src/pages/home.page'
import { OwnersPage } from '../../src/pages/owners.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

// Registered on Sepolia, so the fork has its resolver; setEnsName points it at the test's address
const ENS_NAME = 'testenssepolia.eth'
const AMOUNT = '0.001'

function transferRecipients(history: TransactionItemPage): string[] {
  return transactionsIn(history).flatMap(({ txInfo }) => (txInfo.type === 'Transfer' ? [txInfo.recipient.value] : []))
}

test.describe('ENS names', { tag: '@e2e' }, () => {
  test('should pay the address that an ENS name resolves to when an owner sends to the name', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    await setEnsName(journey.env, ENS_NAME, recipient)
    // setEnsName funds the recipient to sign its reverse record, so the transfer is measured from here
    const balanceBefore = await balanceOf(journey.env, recipient)
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient: ENS_NAME, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.signAndExecute()

    await expect.poll(() => balanceOf(journey.env, recipient)).toBe(balanceBefore + parseEther(AMOUNT))
    await expect
      .poll(async () => transferRecipients(await safeApiClient.getTransactionHistory(safe.address)))
      .toContain(recipient)
  })

  test('should suggest the ENS name of a new signer when its address has a primary name', async ({
    safePage,
    journey,
  }) => {
    const newSigner = Wallet.createRandom().address
    await setEnsName(journey.env, ENS_NAME, newSigner)
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const owners = new OwnersPage(safePage)
    await owners.goto(safe.prefixedAddress)
    await owners.enterNewSigner(newSigner)

    await expect(owners.newSignerName).toHaveAttribute('placeholder', ENS_NAME)
  })
})
