import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedNestedSafe, seedSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'
import { PoliciesPage } from '../../src/pages/policies.page'

const SAFE_NAME = 'Treasury'
const PROPOSER_NAME = 'Workspace proposer'

test.describe('Workspace policies', { tag: '@e2e' }, () => {
  test('should add a proposer policy and then remove it when an owner signs both changes', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { dave, alice } = journey.owners
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { [SAFE_NAME]: safe })

    const policies = new PoliciesPage(safePage)
    await policies.goto(workspaceId)
    await policies.openProposerForm()
    await policies.addProposer({ safeName: SAFE_NAME, proposer: dave.address, name: PROPOSER_NAME })

    await expect
      .poll(async () => (await safeApiClient.getDelegates(safe.address)).results.map((d) => [d.delegate, d.delegator]))
      .toEqual([[dave.address, alice.address]])
    await expect(policies.proposerRow(dave.address)).toContainText(PROPOSER_NAME)

    await policies.removeProposer(dave.address)

    await expect.poll(async () => (await safeApiClient.getDelegates(safe.address)).results).toEqual([])
    await expect(policies.proposerRow(dave.address)).toHaveCount(0)
  })

  test('should offer the parent Safe but not its nested Safe in the proposer policy form', async ({
    safePage,
    journey,
  }) => {
    const { parent, child } = await seedNestedSafe(journey, {
      parent: { owners: ['alice'], threshold: 1 },
      child: { owners: ['parent'], threshold: 1 },
    })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { 'Parent Safe': parent, 'Nested Safe': child })

    const policies = new PoliciesPage(safePage)
    await policies.goto(workspaceId)
    await policies.openProposerForm()
    const options = await policies.safeAccountOptions()

    await expect(options.filter({ hasText: 'Parent Safe' })).toBeVisible()
    await expect(options.filter({ hasText: 'Nested Safe' })).toHaveCount(0)
  })
})
