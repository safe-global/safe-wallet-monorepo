// The trial offer of the creation wizard opens the local billing service's checkout page in place of Stripe's.
import { test, expect } from '../../../src/fixtures/test.fixture'
import { removeSubscription, signInWithEmail, uniqueEmail } from '../../../src/fixtures/email-session'
import { WorkspacePage } from '../../../src/pages/workspace.page'

const WORKSPACE_NAME = 'Trial checkout'

test.describe('Trial checkout from the Workspace creation wizard', { tag: '@regression' }, () => {
  test('should return to the created Workspace when the user goes back from the checkout', async ({ safePage }) => {
    const createdWorkspaces: string[] = []
    await safePage.route('**/v1/spaces', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      const response = await route.fetch()
      const { uuid } = (await response.json()) as { uuid: string }
      createdWorkspaces.push(uuid)
      await removeSubscription(uuid)
      await route.fulfill({ response })
    })
    await signInWithEmail(safePage, uniqueEmail('trial-checkout-back'))
    const workspace = new WorkspacePage(safePage)

    await safePage.goto('/welcome/create-space')
    await workspace.nameInput.fill(WORKSPACE_NAME)
    await workspace.continueButton.click()
    const offer = safePage.getByRole('dialog', { name: 'Workspaces run on Safe Pro' })
    await offer.getByRole('radio', { name: /^Starter/ }).click()
    await offer.getByRole('button', { name: 'Claim free access' }).click()
    await expect(safePage).toHaveURL(/\/billing\/checkout\/cs_e2e_\d+$/)
    await safePage.goBack()

    await expect(safePage).toHaveURL(new RegExp(`/welcome/create-space\\?spaceId=${createdWorkspaces[0]}$`))
    await expect(workspace.nameInput).toHaveValue(WORKSPACE_NAME)
    await workspace.continueButton.click()
    await expect(safePage).toHaveURL(new RegExp(`/welcome/select-safes\\?spaceId=${createdWorkspaces[0]}$`))
    expect(createdWorkspaces).toHaveLength(1)
  })
})
