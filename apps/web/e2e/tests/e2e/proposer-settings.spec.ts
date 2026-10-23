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
    const { owner3, owner4 } = journey.owners
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    const workspaceId = await seedBusinessWorkspace(safePage, { 'Proposer Safe': safe })

    const proposers = new ProposersPage(safePage)
    await proposers.goto(safe.prefixedAddress, workspaceId)
    await proposers.add(owner3.address, PROPOSER_NAME)

    await expect
      .poll(async () => (await safeApiClient.getDelegates(safe.address)).results.map((d) => [d.delegate, d.delegator]))
      .toEqual([[owner3.address, owner4.address]])
    await expect(proposers.row(owner3.address)).toBeVisible()

    await proposers.delete(owner3.address)

    await expect.poll(async () => (await safeApiClient.getDelegates(safe.address)).results).toEqual([])
    await expect(proposers.row(owner3.address)).toHaveCount(0)
  })
})
