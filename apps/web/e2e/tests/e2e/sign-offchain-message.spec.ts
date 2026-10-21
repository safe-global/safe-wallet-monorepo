import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedOffchainMessage } from '../../src/seed/messages'
import { seedSafe } from '../../src/seed/safe'
import { MessagesPage } from '../../src/pages/messages.page'
import { WalletPage } from '../../src/pages/wallet.page'

// The message row cuts the text after 20 characters
const MESSAGE = 'Second owner signs'

test.describe('Sign an off-chain message with a second owner', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should confirm a message when the second owner signs it', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const safe = await seedSafe(journey, { threshold: 2 })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })
    const messageHash = await seedOffchainMessage(safe, MESSAGE)

    const wallet = new WalletPage(safePage)
    const messages = new MessagesPage(safePage)
    await messages.goto(safe.prefixedAddress)
    await wallet.disconnect()
    await wallet.connectWallet(journey.owners.owner1.privateKey)
    await expect(messages.message(MESSAGE)).toContainText('1/2')
    await messages.sign(MESSAGE)
    await expect(messages.message(MESSAGE)).toContainText('Confirmed')
    await expect(messages.message(MESSAGE)).toContainText('2/2')

    const message = await safeApiClient.getMessage(messageHash)
    expect(message.confirmationsSubmitted).toBe(2)
    expect(message.status).toBe('CONFIRMED')
  })
})
