import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'
import { ProposersPage } from '../../src/pages/proposers.page'

const PROPOSER_NAME = 'Isolated proposer'

test.describe('Proposers in the Safe settings', { tag: '@e2e' }, () => {
  test('should let an owner add and delete a proposer on a Business plan', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { dave, alice } = journey.owners
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { 'Proposer Safe': safe })

    const proposers = new ProposersPage(safePage)
    await proposers.goto(safe.prefixedAddress, workspaceId)
    await proposers.add(dave.address, PROPOSER_NAME)

    await expect
      .poll(async () => (await safeApiClient.getDelegates(safe.address)).results.map((d) => [d.delegate, d.delegator]))
      .toEqual([[dave.address, alice.address]])
    await expect(proposers.row(dave.address)).toBeVisible()

    await proposers.delete(dave.address)

    await expect.poll(async () => (await safeApiClient.getDelegates(safe.address)).results).toEqual([])
    await expect(proposers.row(dave.address)).toHaveCount(0)
  })
})
