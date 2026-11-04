import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedOffchainMessage } from '../../src/seed/messages'
import { seedSafe } from '../../src/seed/safe'
import { MessagesPage } from '../../src/pages/messages.page'

// The message row cuts the text after 20 characters
const MESSAGE = 'Second owner signs'

test.describe('Sign an off-chain message with a second owner', { tag: '@e2e' }, () => {
  test('should confirm a message when the second owner signs it', async ({ safePage, safeApiClient, journey }) => {
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 2 })
    const messageHash = await seedOffchainMessage(safe, MESSAGE)

    const messages = new MessagesPage(safePage)
    await journey.connectAs('owner1')
    await messages.goto(safe.prefixedAddress)
    await expect(messages.message(MESSAGE)).toContainText('1/2')
    await messages.sign(MESSAGE)
    await expect(messages.message(MESSAGE)).toContainText('Confirmed')
    await expect(messages.message(MESSAGE)).toContainText('2/2')

    const message = await safeApiClient.getMessage(messageHash)
    expect(message.confirmationsSubmitted).toBe(2)
    expect(message.status).toBe('CONFIRMED')
  })
})
